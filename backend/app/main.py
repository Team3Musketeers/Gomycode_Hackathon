from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    RefactorRequest,
    RefactorResponse,
    RefactorRepoRequest,
    RefactorRepoResponse,
    DryRunResult,
)
from .llm_client import call_llm_for_refactor, LLMParseError, RateLimitError
from .dry_run import run_python_tests_dry_run

app = FastAPI(title="Legacy Migrate API")

# Wide open for the hackathon demo — frontend runs on a different port/origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def _run_refactor(code: str, recipe: str, filename: Optional[str]) -> RefactorResponse:
    """Shared core: single source of truth so /refactor and /refactor-repo
    can never drift apart in behavior."""
    result = call_llm_for_refactor(code, recipe)

    # Dry-run execution: python2to3 only for now. js_callback_async tests
    # would need a Node sandbox — stated limitation, not implemented yet.
    if recipe == "python2to3":
        dry_run_result = run_python_tests_dry_run(result["tests"])
    else:
        dry_run_result = {
            "attempted": False,
            "passed": None,
            "output": "Dry-run execution not implemented for this recipe yet.",
        }

    # Layer 4 will replace this stub rule with the real confidence logic.
    confidence = "needs_human_review"
    confidence_reason = "Confidence rule not yet implemented (Layer 4)."

    return RefactorResponse(
        filename=filename,
        recipe=recipe,
        refactored_code=result["refactored_code"],
        explanation=result["explanation"],
        tests=result["tests"],
        dry_run=DryRunResult(**dry_run_result),
        security_notes=result["security_notes"],
        confidence=confidence,
        confidence_reason=confidence_reason,
    )


@app.post("/refactor", response_model=RefactorResponse)
def refactor(req: RefactorRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="code must not be empty")

    try:
        return _run_refactor(req.code, req.recipe, req.filename)
    except RateLimitError as e:
        # 503 = "try again shortly", distinct from a genuine parse failure.
        raise HTTPException(status_code=503, detail=f"Rate limited: {e}")
    except LLMParseError as e:
        # Surface as 502 so the frontend can show "AI service hiccup, retry"
        # rather than a generic 500.
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/refactor-repo", response_model=RefactorRepoResponse)
def refactor_repo(req: RefactorRepoRequest):
    """Batch-calls the same refactor logic per file, independently.
    One file failing (rate limit, bad JSON from the model) does not sink
    the whole repo — it's recorded in `failed` and the rest still runs.
    No cross-file awareness yet; that's the stated Section 8 limitation."""
    results = []
    failed = []

    for f in req.files:
        if not f.code.strip():
            failed.append({"filename": f.filename, "error": "code must not be empty"})
            continue
        try:
            results.append(_run_refactor(f.code, req.recipe, f.filename))
        except RateLimitError as e:
            failed.append({"filename": f.filename, "error": f"Rate limited: {e}"})
        except LLMParseError as e:
            failed.append({"filename": f.filename, "error": str(e)})

    return RefactorRepoResponse(results=results, failed=failed)