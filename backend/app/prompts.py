"""
Person B owns refining these — this is a working placeholder so Person A/C
can wire and test the real OpenRouter call end-to-end today without waiting.

Whatever Person B writes must keep the same contract: build_prompt(code, recipe)
-> str, and the model must be told to return ONLY JSON with these four keys:
refactored_code, explanation, tests, security_notes.
"""

RECIPE_INSTRUCTIONS = {
    "python2to3": "Migrate this Python 2 code to idiomatic Python 3.",
    "js_callback_async": "Migrate this Node.js callback-style code to async/await.",
}


def build_prompt(code: str, recipe: str) -> str:
    instruction = RECIPE_INSTRUCTIONS[recipe]
    return f"""You are a careful code migration assistant.

{instruction}

Return ONLY a single JSON object — no markdown code fences, no preamble, no
trailing commentary — with exactly these keys:
- "refactored_code": the migrated code, as a string
- "explanation": plain-language reasoning for each major change you made
- "tests": generated unit tests as text (do not claim you executed them)
- "security_notes": security-relevant observations, or "No issues found" if none

Original code:
{code}
"""