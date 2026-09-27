# backend/app/aggregation.py
"""Layers 4 & 5: confidence reasoning + repo-level aggregation.

The LLM returns a confidence flag per file (Job 1). This module turns those
individual results into two things:

  Layer 4 - a human-readable reasoning string for each confidence flag, so
            the flag is never shown to a developer as a bare score.
  Layer 5 - a repo-level summary payload that the frontend consumes directly.

The reasoning string is generated deterministically here, not by the LLM.
That is deliberate: the flag is AI judgment, the explanation of why we
surfaced the flag is ours, and a developer can verify the second one by
reading this function.
"""


def generate_confidence_reasoning(confidence: str, security_notes: str) -> str:
    """Layer 4: Generate a deterministic reasoning string based on the LLM's flags."""
    if confidence == "safe_to_merge":
        if "no issues" in security_notes.lower() or "clean" in security_notes.lower():
            return "Mechanical syntax update with clean security profile."
        return "Mechanical update, but review security notes."
    return "Requires review: Complex logical changes or potential edge cases detected."


def aggregate_repo_results(per_file_results: list) -> dict:
    """
    Layer 5: Aggregates a list of single-file refactor results into a repo summary.
    Expects a list of dicts: {"filename": str, "original_code": str, "llm_result": dict}
    """
    summary = {
        "total_files_processed": len(per_file_results),
        "safe_to_merge_count": 0,
        "needs_review_count": 0,
        "files": []
    }

    for file_data in per_file_results:
        llm_data = file_data.get("llm_result", {})
        confidence = llm_data.get("confidence", "needs_human_review")

        if confidence == "safe_to_merge":
            summary["safe_to_merge_count"] += 1
        else:
            summary["needs_review_count"] += 1

        reasoning = generate_confidence_reasoning(
            confidence,
            llm_data.get("security_notes", "")
        )

        summary["files"].append({
            "filename": file_data["filename"],
            "original_code": file_data["original_code"],
            "refactored_code": llm_data.get("refactored_code", ""),
            "explanation": llm_data.get("explanation", ""),
            "tests": llm_data.get("tests", ""),
            "security_notes": llm_data.get("security_notes", ""),
            "confidence": confidence,
            "confidence_reasoning": reasoning
        })

    return summary
