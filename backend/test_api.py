"""
Manual Layer 0 / OpenRouter API smoke test.

This file is safe to import during `python -m unittest discover`.
The real external API request only runs when this file is executed directly:

    python test_api.py

Environment:
    OPENROUTER_API_KEY=...
    OPENROUTER_MODEL=openrouter/free
"""

import os

import requests
from dotenv import load_dotenv


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def main() -> int:
    load_dotenv()

    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "openrouter/free")

    if not api_key:
        print(
            "OPENROUTER_API_KEY is not set. "
            "Add it to backend/.env before running this manual smoke test."
        )
        return 1

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": "Reply with exactly one word: WORKING",
            }
        ],
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=60,
        )
    except requests.RequestException as exc:
        print(f"OpenRouter request failed: {exc}")
        return 1

    print("HTTP status:", response.status_code)

    if response.status_code == 429:
        print("OpenRouter quota/rate limit reached.")
        return 2

    if response.status_code != 200:
        print("OpenRouter error:", response.text[:500])
        return 1

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError):
        print("Unexpected OpenRouter response:", response.text[:500])
        return 1

    print("API response:", content)

    if "WORKING" in content.upper():
        print("OpenRouter API access confirmed.")
        return 0

    print("API responded, but the expected WORKING marker was not found.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())