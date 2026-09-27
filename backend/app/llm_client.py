"""
Real OpenRouter wiring. Reads OPENROUTER_API_KEY from a local .env file
(see .env.example) — never hardcode the key or commit .env.

Contract this function satisfies (unchanged from the stub, so main.py never
needs to change): call_llm_for_refactor(code, recipe) -> dict with keys
refactored_code, explanation, tests, security_notes.
"""

import json
import os
import re
import time

import requests
from dotenv import load_dotenv

from .prompts import build_prompt

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# qwen/qwen3-coder:free was deprecated mid-2026 and now 404s.
# OpenRouter's free-model catalog shifts week to week, so before the actual
# hackathon day, check https://openrouter.ai/models?max_price=0 and swap this
# for whatever's live. qwen/qwen3.8-27b:free is a reasonable current pick
# (same provider, similar strengths). openrouter/free (an auto-router that
# always resolves to *some* live free model) is a safer fallback if this one
# also gets pulled — slightly less predictable output, but won't 404.
MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen3.8-27b:free")


class LLMParseError(Exception):
    pass


class RateLimitError(Exception):
    pass


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return text.strip()


def _call_openrouter(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        raise LLMParseError(
            "OPENROUTER_API_KEY not set — copy .env.example to .env and add your key"
        )
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }
    resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)

    if resp.status_code == 429:
        retry_after = resp.headers.get("retry-after")
        raise RateLimitError(
            f"Rate limited by OpenRouter (retry-after={retry_after!r}). "
            f"Body: {resp.text[:300]}"
        )

    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _validate_keys(data: dict) -> None:
    required = {"refactored_code", "explanation", "tests", "security_notes"}
    missing = required - data.keys()
    if missing:
        raise LLMParseError(f"LLM response missing keys: {missing}")


def call_llm_for_refactor(code: str, recipe: str, max_retries: int = 2) -> dict:
    prompt = build_prompt(code, recipe)
    last_err = None

    for attempt in range(max_retries + 1):
        try:
            raw = _call_openrouter(prompt)
            parsed = json.loads(_strip_code_fences(raw))
            _validate_keys(parsed)
            return parsed
        except (json.JSONDecodeError, KeyError) as e:
            last_err = e
            time.sleep(0.5)
        except requests.RequestException as e:
            last_err = e
            time.sleep(1)

    raise LLMParseError(
        f"LLM did not return valid JSON after {max_retries + 1} attempts: {last_err}"
    )