# backend/app/prompts.py
"""Prompt library for Legacy Migrate.

Two distinct AI jobs, deliberately kept as separate prompts:

  Job 1 (get_refactor_prompt)  - per-file mechanical transformation.
  Job 2 (get_roadmap_prompt)   - portfolio-level prioritisation, which also
                                 receives the deterministic dependency map
                                 built by the regex pass so the LLM reasons
                                 over real in-degree/out-degree data instead of
                                 guessing. See Section 2 of the plan.

The dependency graph itself is NOT produced here. It is plain regex parsing
and must stay that way - it is the provable, checkable half of the product.
"""

# Recipe identifiers. Kept in sync with the samples/ directory names so the
# frontend and the prompt text cannot drift apart.
RECIPES = {
    "python2to3": "Python 2 -> Python 3",
    "js_callback_to_async": "Node.js callbacks -> async/await",
}

SYSTEM_PROMPT = """You are an expert AI migration specialist. Your job is to refactor legacy code safely.
You MUST output ONLY valid JSON. Do not include markdown blocks like ```json.
Your response must strictly match this structure:
{
    "refactored_code": "string (the complete updated file content)",
    "explanation": "string (plain-language reasoning for the major changes made)",
    "tests": "string (executable unit test code for the refactored code, no prose, no Markdown)",
    "security_notes": "string (brief security commentary, e.g., 'no issues found' or noting specific risks mitigated)",
    "confidence": "string ('safe_to_merge' OR 'needs_human_review')"
}"""


def get_refactor_prompt(file_content: str, recipe: str) -> str:
    recipe_instructions = {
        "python2to3": "Update Python 2 syntax to Python 3. Replace xrange with range, print statements with print(), and legacy urllib/urllib2 with modern equivalents (like urllib.request or requests).",
        "js_callback_to_async": "Refactor nested Node.js callbacks into modern async/await syntax. Return Promises instead of accepting callback functions."
    }

    instruction = recipe_instructions.get(recipe, "Refactor to modern standards.")

    return f"""Apply the following migration recipe to the code provided: {instruction}

Ensure your JSON output includes:
1. The fully refactored code.
2. A clear explanation of *why* you made these specific changes.
3. Executable unit tests for the refactored code. See the test rules below.
4. Security implications (if any).
5. 'safe_to_merge' if it's a straightforward mechanical change, or 'needs_human_review' if it involves complex logical changes.

The "tests" value MUST be real, runnable test code - never prose. It will be
executed against a copy of the refactored code, so anything that does not
actually run is worse than useless. Every one of these rules is mandatory:
- Include every import the test code needs. If the test uses any module
  (for example `sys`, `os`, `json`, `unittest`, or the module under test),
  import it explicitly at the top. Never rely on a name being pre-imported.
- Include at least one real assertion per behaviour under test. An assertion
  must actually be capable of failing on a wrong result.
- Test only functions and attributes that exist in the refactored code above.
  Do not invent, guess at, or call a function that is not defined there. If a
  function is not reachable for testing, test the observable behaviour instead
  and say nothing rather than calling something undefined.
- Output raw source code only. No Markdown, no ``` fences, no surrounding
  quotes, no commentary, no headings, no "Here are the tests:" preamble.
- Emit real newlines. Never write an escaped backslash-n pair as a stand-in for
  a line break; that is a syntax error once the value is parsed out of JSON.
- The code must be syntactically valid for its language and must run top to
  bottom without raising NameError, SyntaxError, or ImportError.


Code to refactor:
{file_content}
"""


# --- Job 2: portfolio-level prioritisation -------------------------------
#
# Same JSON discipline as Job 1, because the free-tier models we use on
# OpenRouter are far less reliable at "output only JSON" than Claude is. The
# schema is deliberately flat and pre-ordered so a sloppy response still
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
- You are advising a human. State reasoning, never act on it."""


def get_roadmap_prompt(per_file_summaries: list, dependency_map: dict) -> str:
    """Build the Job 2 prompt.

    per_file_summaries: list of {"file", "confidence", "security_notes"} dicts
                         from the per-file refactor pass.
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
1. Unblocking: files that many other files depend on, and files with no
   dependencies of their own, are cheap to do early.
2. Blast radius: a file that other files require() is riskier to change, so
   schedule it deliberately rather than casually.
3. The confidence verdict, as a tiebreaker only. Do not simply echo it.

For each file, risk_level must reflect how much would break if that file's
public interface changed, judged primarily from the dependency map. A file
with no dependents is low risk regardless of its refactor verdict.

Write 'reasoning' for why the file sits at that position in the order, and
'risk_commentary' naming the specific files that would need updating if it
changes. Reference real filenames from the dependency map, not generic advice.
"""
