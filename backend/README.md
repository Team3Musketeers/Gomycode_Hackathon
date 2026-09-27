# Legacy Migrate — Backend (Layer 1 skeleton)

## Run it
```
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Test it
```
curl -X POST http://localhost:8000/refactor \
  -H "Content-Type: application/json" \
  -d '{"code": "print \"hello\"", "recipe": "python2to3"}'
```

Right now this returns MOCK data (see `app/llm_client.py`) so the frontend
and Layer 2/3 work can proceed in parallel without waiting on the real
OpenRouter call.

## Who touches what next
- **Person B**: add `app/prompts.py` with the per-recipe prompt text
  (the "why this change" instruction). Import it from `llm_client.py`.
- **Person C**: replace `call_llm_for_refactor()` in `app/llm_client.py`
  with the real OpenRouter call + retry/reparse. Keep the input/output
  signature identical — nothing in `main.py` should need to change.
- **Layer 2/3**: `tests` and `security_notes` already exist as fields —
  just make sure the real LLM response fills them in with real content
  instead of the mock placeholders.
- **Layer 4**: replace the two hardcoded lines in `main.py` (`confidence`,
  `confidence_reason`) with the real rule.