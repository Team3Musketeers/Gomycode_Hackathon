# backend/app/prompts.py
"""Prompt library for Legacy Migrate.

Job 1 (get_refactor_prompt) - per-file mechanical transformation. That is this
module's whole job: the per-recipe prompt text for the first AI call.

Job 2 (the Migration Roadmap) lives in roadmap.py, per the agreed structure.
get_roadmap_prompt and ROADMAP_SYSTEM_PROMPT are re-exported lazily from here
so existing imports of them keep working; see the note at the bottom.

The dependency graph itself is NOT produced by either job. It is plain regex
parsing in dependency_graph.py and must stay that way - it is the provable,
checkable half of the product.
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


# --- Job 2 lives in roadmap.py -------------------------------------------
#
# Layer 6b (the Migration Roadmap) started life here, then moved to its own
# module to match the agreed structure: prompts.py is the per-recipe prompt
# text for Job 1, roadmap.py is Job 2's prompt plus its calling and validation
# logic. The two re-exports below keep any existing
# `from .prompts import get_roadmap_prompt` working, so moving the code broke
# nothing.
#
# The indirection is lazy on purpose: roadmap.py imports llm_client, which
# imports prompts.py. A module-level import here would be circular.


def __getattr__(name):
    if name in ("ROADMAP_SYSTEM_PROMPT", "get_roadmap_prompt"):
        from . import roadmap
        return getattr(roadmap, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
