from pathlib import Path
import argparse
import requests

# Default matches the port test_security_notes.py and the README use
# (`uvicorn app.main:app --reload --port 8000`). The port used to be pinned
# to 8001 here, so this script always got connection-refused against a
# default server and reported every sample as a failure.
DEFAULT_BASE_URL = "http://localhost:8000"

SAMPLES_DIR = Path(__file__).parent.parent / "samples" / "py2to3"

EXPECTED_SECURITY_SIGNALS = {
    "04_urllib2_unicode.py": ["url", "request", "ssrf", "external"],
}


def validate_sample(path: Path, api_url: str) -> bool:
    code = path.read_text(encoding="utf-8")

    payload = {
        "code": code,
        "recipe": "python2to3",
        "filename": path.name,
    }

    try:
        response = requests.post(api_url, json=payload, timeout=90)
    except requests.RequestException as exc:
        print(f"[FAIL] {path.name} -> API error: {exc}")
        return False

    if response.status_code == 503 and "Rate limited" in response.text:
        print(f"[BLOCKED] {path.name} -> OpenRouter daily quota exhausted")
        return None

    if response.status_code != 200:
        print(
            f"[FAIL] {path.name} -> HTTP {response.status_code}: "
            f"{response.text[:300]}"
        )
        return False

    data = response.json()

    notes = data.get("security_notes")

    if not isinstance(notes, str) or not notes.strip():
        print(f"[FAIL] {path.name} -> security_notes is missing or empty")
        return False

    notes_lower = notes.lower()

    expected_signals = EXPECTED_SECURITY_SIGNALS.get(path.name)

    if expected_signals:
        if not any(signal in notes_lower for signal in expected_signals):
            print(
                f"[WARN] {path.name} -> security note exists, "
                f"but expected URL/security context was not detected"
            )
            print(f"       Security notes: {notes}")
            return False

    print(f"[PASS] {path.name}")
    print(f"       Security notes: {notes}")

    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Backend base URL, without the /refactor suffix.",
    )
    args = parser.parse_args()
    api_url = f"{args.base_url.rstrip('/')}/refactor"

    files = sorted(SAMPLES_DIR.glob("*.py"))

    if not files:
        print("No Python samples found.")
        return

    passed = 0
    blocked = 0

    print(f"Hitting {api_url} for {len(files)} samples...\n")
    print("=== Layer 3 Security Notes Validation ===\n")

    for file in files:
        result = validate_sample(file, api_url)

        if result is True:
            passed += 1
        elif result is None:
            blocked += 1

        print()

    print("========================================")
    print(f"Passed: {passed}/{len(files)}")
    print(f"Blocked by quota: {blocked}/{len(files)}")

    if passed == len(files):
        print("LAYER 3 VALIDATED")
    elif blocked > 0:
        print("LAYER 3 VALIDATION BLOCKED BY OPENROUTER QUOTA")
    else:
        print("LAYER 3 NEEDS REVIEW")


if __name__ == "__main__":
    main()