# backend/app/roadmap.py
"""Layer 6b: the Migration Roadmap - the second, distinct AI job.

Job 1 (prompts.get_refactor_prompt) transforms one file at a time. This module
is Job 2: it looks at every file's verdict *together* and decides the order in
which the repo should be migrated. That second call is the thing Copilot and
Cursor do not do, and the reason this product exists.

The split that matters for the demo, and for Responsible AI:

    "what depends on what"  -> deterministic. dependency_graph.build_dependency_map
                               is a regex pass. No LLM. Readable and checkable.
    "in what order, and how
     worried should we be"    -> AI judgment, layered on top of that data.

The AI is never asked to invent dependencies. It is handed the parsed graph and
asked to reason about it. Whatever the model says about priority or prose, the
depends_on / depended_on_by fields returned by call_roadmap() come straight
from the regex pass, never from the model - so the two can never contradict
each other in the payload the UI renders.

This module does NOT decide that a change is safe; it only ranks and explains.
No file is modified and no action is taken. Everything here is advisory.
"""

import json
import time
from typing import Dict, List, Optional

from .llm_client import (
    LLMParseError,
    RateLimitError,
    _call_openrouter,
    _strip_code_fences,
)

# Same JSON discipline as Job 1: the free/cheap models we route through
# OpenRouter are far less reliable at "output only JSON" than Claude is, so the
# schema is deliberately flat and pre-ordered, and a sloppy response still
# degrades into a usable ranking rather than an unparseable blob.
ROADMAP_SYSTEM_PROMPT = """You are an expert AI migration strategist. You plan the order in which a small legacy repository should be migrated.
You MUST output ONLY valid JSON. Do not include markdown blocks like ```json.
Your response must strictly match this structure:
{
    "roadmap": [
        {
            "file": "string (filename, exactly as given in the input)",
            "priority": "integer (1 = migrate first)",
            "risk_level": "string ('low' OR 'medium' OR 'high')",
            "reasoning": "string (one sentence on why this file sits here in the order)",
            "risk_commentary": "string (one sentence: what specifically breaks if this file is changed)"
        }
    ]
}

Rules:
- Return exactly one entry per input file. Never omit a file, never invent one.
- 'priority' must be a contiguous 1..N sequence with no gaps and no duplicates.
- You are advising a human. State reasoning, never act on it.

The two dependency lists mean OPPOSITE things. Getting this backwards makes
you contradict the data shown next to your answer, so read it twice:
- "depended_on_by" = the files that break IF THIS FILE CHANGES. These are the
  ones you must name in risk_commentary.
- "depends_on" = the files this one relies on. Changing THIS file does NOT
  require updating them. Never name them as the things that break.

risk_level is decided by in_degree alone, using these bands:
- in_degree 0 -> "low"    (nothing in this repo breaks)
- in_degree 1 -> "medium"
- in_degree 2 or more -> "high"
Do not let the refactor verdict raise or lower it. A file nothing depends on
is "low" risk even if the model flagged it for review, because a review note
does not break callers."""


def get_roadmap_prompt(per_file_summaries: list, dependency_map: dict) -> str:
    """Build the Job 2 prompt.

    per_file_summaries: list of {"file", "confidence", "security_notes"} dicts
                         from the per-file refactor pass. Use
                         build_summaries() to derive these from the
                         /refactor-repo response.
    dependency_map:     {"file": {"depends_on": [...], "depended_on_by": [...]}}
                        produced by the deterministic regex pass. This is real
                        parsed data, not model output - lean on it.
    """
    return f"""Below is a small legacy repository. For each file you are given the AI refactor verdict, plus a dependency map computed by static parsing of require()/import statements.

Per-file refactor verdicts:
{per_file_summaries}

Dependency map (deterministic, from regex parsing - treat as ground truth):
{dependency_map}

Rank every file into a migration roadmap. Order the list by:
1. Blast radius first: a file with a high in_degree is riskier to change, so
   schedule it deliberately rather than casually.
2. Unblocking: files with no dependencies of their own are cheap to do early,
   because nothing in this repo can be broken by them.
3. The confidence verdict, as a tiebreaker only. Do not simply echo it.

For 'reasoning', give one sentence on why the file sits at that position,
grounded in its in_degree and out_degree.
For 'risk_commentary', name the specific files from "depended_on_by" that
would need updating if this file changed. If depended_on_by is empty, say
plainly that nothing in this repo depends on it. Never invent a file name,
and never name a file from "depends_on" as something that would break.
"""


def build_summaries(refactor_results) -> List[dict]:
    """Turn /refactor-repo results into the compact shape the prompt wants.

    Accepts a list of RefactorResponse objects, or of dicts with the same
    fields, so the endpoint can pass req.files straight through. Files that
    failed and have no result simply do not appear - the roadmap ranks what
    was actually analysed rather than pretending it succeeded.
    """
    summaries = []
    for r in refactor_results or []:
        if isinstance(r, dict):
            name = r.get("filename")
            conf = r.get("confidence")
            sec = r.get("security_notes")
        else:
            name = getattr(r, "filename", None)
            conf = getattr(r, "confidence", None)
            sec = getattr(r, "security_notes", None)
        if not name:
            continue
        summaries.append({
            "file": name,
            "confidence": conf or "needs_human_review",
            "security_notes": sec or "",
        })
    return summaries


def _validate(data: dict, expected_files: List[str]) -> None:
    """Reject a roadmap we cannot trust, so call_roadmap can retry.

    A model that drops a file, invents one, or produces a priority sequence
    with gaps would silently corrupt the demo's central screen, so treat all
    three as parse failures and re-ask.
    """
    if not isinstance(data, dict) or "roadmap" not in data:
        raise LLMParseError("roadmap response has no 'roadmap' key")

    entries = data["roadmap"]
    if not isinstance(entries, list):
        raise LLMParseError("'roadmap' is not a list")

    got = [e.get("file") for e in entries]
    if sorted(got) != sorted(expected_files):
        raise LLMParseError(
            f"roadmap covers {sorted(got)}, expected exactly {sorted(expected_files)}"
        )

    priorities = sorted(e.get("priority") for e in entries)
    if priorities != list(range(1, len(entries) + 1)):
        raise LLMParseError(f"priorities are not a contiguous 1..N sequence: {priorities}")


def call_roadmap(
    per_file_summaries: list,
    dependency_map: dict,
    max_retries: int = 2,
) -> dict:
    """Run Job 2 and return the roadmap the UI renders.

    Returns:
        {"roadmap": [ {file, priority, risk_level, reasoning, risk_commentary,
                       depends_on, depended_on_by, in_degree, out_degree} ],
         "dependency_map": <the deterministic map, passed through untouched>}

    The five AI-authored fields come from the model. depends_on,
    depended_on_by, in_degree and out_degree are copied from dependency_map
    and can therefore never disagree with the Blast Radius panel, which reads
    the same deterministic source.

    Raises LLMParseError if the model never produced a usable ranking.
    """
    expected = list(dependency_map.keys())
    if not expected:
        return {"roadmap": [], "dependency_map": {}}
    if not per_file_summaries:
        # No verdict yet: we can still show the real graph, just without the
        # AI's ordering. Better than failing the whole screen.
        per_file_summaries = [{"file": f, "confidence": "unknown", "security_notes": ""}
                              for f in expected]

    user_prompt = get_roadmap_prompt(per_file_summaries, dependency_map)
    last_err = None

    for attempt in range(max_retries + 1):
        try:
            raw = _call_openrouter(ROADMAP_SYSTEM_PROMPT, user_prompt)
            parsed = json.loads(_strip_code_fences(raw))
            _validate(parsed, expected)
            break
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            last_err = e
            time.sleep(0.5)
        except RateLimitError:
            if attempt < max_retries:
                time.sleep(5)
                continue
            raise
        except Exception as e:  # LLMParseError from _validate
            last_err = e
            time.sleep(0.5)
    else:
        raise LLMParseError(
            f"roadmap model did not return a usable ranking after "
            f"{max_retries + 1} attempts: {last_err}"
        )

    by_file = {e["file"]: e for e in parsed["roadmap"]}
    roadmap = []
    for filename in expected:
        e = by_file[filename]
        dep = dependency_map[filename]
        roadmap.append({
            "file": filename,
            "priority": e.get("priority"),
            "risk_level": e.get("risk_level", "medium"),
            "reasoning": e.get("reasoning", ""),
            "risk_commentary": e.get("risk_commentary", ""),
            # Deterministic fields, straight from the regex pass.
            "depends_on": dep.get("depends_on", []),
            "depended_on_by": dep.get("depended_on_by", []),
            "in_degree": dep.get("in_degree", 0),
            "out_degree": dep.get("out_degree", 0),
        })

    roadmap.sort(key=lambda r: (r["priority"] is None, r["priority"]))
    return {"roadmap": roadmap, "dependency_map": dependency_map}
