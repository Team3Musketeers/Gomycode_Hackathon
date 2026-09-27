"""
Layer 3 stress test harness.

Runs a fixed set of samples through the LOCAL running server's /refactor
endpoint and prints each file's security_notes side by side, so you can
eyeball whether:
  - clean samples come back with a genuinely "nothing found" answer
    (not a manufactured nitpick)
  - dirty samples actually get flagged, and the flag names the real issue
  - confidence lines up sensibly with the security verdict

This does NOT call OpenRouter directly - it calls your own FastAPI server,
which must already be running (uvicorn app.main:app --reload) with a valid
OPENROUTER_API_KEY in backend/.env.

Usage:
    python test_security_notes.py
    python test_security_notes.py --base-url http://localhost:8000
"""

import argparse
import sys

import requests

# (filename, recipe, code, expect_clean)
# expect_clean is just a hint printed in the report - not a hard assertion,
# since we can't force free-model wording, but it flags surprises to check by eye.
CASES = [
    ("python2to3_clean.py", "python2to3", "samples/python2to3_clean.py", True),
    ("python2to3_dirty_eval.py", "python2to3", "samples/py2to3_dirty_eval.py", False),
    ("js_callback_clean.js", "js_callback_to_async", "samples/js_callback_clean.js", True),
    ("js_callback_dirty_secrets.js", "js_callback_to_async", "samples/js_callback_dirty_secrets.js", False),
]


def load(path: str) -> str:
    with open(path, "r") as f:
        return f.read()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()

    print(f"Hitting {args.base_url}/refactor for {len(CASES)} cases...\n")

    rows = []
    for filename, recipe, path, expect_clean in CASES:
        try:
            code = load(path)
        except FileNotFoundError:
            print(f"[SKIP] {filename}: sample file not found at {path}")
            continue

        try:
            resp = requests.post(
                f"{args.base_url}/refactor",
                json={"code": code, "recipe": recipe, "filename": filename},
                timeout=150,
            )
        except requests.RequestException as e:
            print(f"[ERROR] {filename}: request failed - {e}")
            continue

        if resp.status_code != 200:
            print(f"[ERROR] {filename}: HTTP {resp.status_code} - {resp.text[:300]}")
            continue

        data = resp.json()
        notes = data.get("security_notes", "<MISSING>")
        confidence = data.get("confidence", "<MISSING>")
        rows.append((filename, expect_clean, notes, confidence))

    print("=" * 100)
    for filename, expect_clean, notes, confidence in rows:
        expected = "expected CLEAN" if expect_clean else "expected FLAGGED"
        print(f"\nFILE: {filename}  ({expected})")
        print(f"  confidence:     {confidence}")
        print(f"  security_notes: {notes}")
    print("\n" + "=" * 100)
    print(
        "\nEyeball checklist:\n"
        "  1. Do the two 'expected CLEAN' files get a genuinely empty-handed answer\n"
        "     (e.g. 'No issues found'), not an invented nitpick?\n"
        "  2. Do the two 'expected FLAGGED' files name the ACTUAL issue\n"
        "     (eval/hardcoded key/SQL concat), not a generic disclaimer?\n"
        "  3. Is the wording consistent enough that a simple rule could tell\n"
        "     clean apart from flagged? If not, that's your Layer 4 blocker -\n"
        "     consider adding a security_clean: bool field to the schema."
    )


if __name__ == "__main__":
    sys.exit(main())