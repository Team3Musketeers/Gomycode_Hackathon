"""
Layer 0 check: confirm the team's Anthropic API access works
before anyone starts building the real /refactor endpoint.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    pip install anthropic --break-system-packages
    python test_api.py
"""

import os
import sys

try:
    import anthropic
except ImportError:
    print("Missing dependency. Run: pip install anthropic --break-system-packages")
    sys.exit(1)

api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    print("ANTHROPIC_API_KEY is not set. Run: export ANTHROPIC_API_KEY=your-key-here")
    sys.exit(1)

client = anthropic.Anthropic(api_key=api_key)

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=100,
    messages=[
        {
            "role": "user",
            "content": "Reply with exactly one word: WORKING",
        }
    ],
)

print("API response:", response.content[0].text)
print("\nIf you see WORKING above, API access is confirmed. Layer 0 is done.")
