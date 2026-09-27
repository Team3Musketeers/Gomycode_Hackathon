"""
Layer 4: confidence flag logic.

Design decision (resolves the open question from the plan - "fold in the
model's self-reported confidence, or derive independently?"):

    safe_to_merge  <=>  model self-reports "safe_to_merge"
                        AND dry-run actually executed and passed

Both conditions are required. The model's own confidence is a necessary
signal but never sufficient on its own - a free model saying "safe_to_merge"
with no way to verify it isn't good enough to auto-approve anything.

security_notes is deliberately NOT used as an automated gate here, even
though the field exists. Evidence from Layer 3 stress-testing showed why:
a genuinely clean, already-fixed file can still contain risk-sounding
keywords in its own explanation (e.g. "Mitigated SQL injection... no
critical issues remain" - the words "SQL injection" appear in a SUCCESS
message). A keyword classifier over that text would misfire. Until the
schema adds a structured security_clean: bool field (a real, separate
decision - it changes the model contract), security_notes stays visible
to the human reviewer but does not drive an automated decision.

Consequence, stated plainly (this is a feature, not a bug, for the demo's
Responsible AI story): js_callback_to_async can never reach safe_to_merge
right now, because there is no dry-run sandbox for it yet (Section 8's
already-stated limitation). Every JS result needs human review until that
exists. python2to3 can reach safe_to_merge when both signals agree.
"""

from typing import Optional


def derive_confidence(model_confidence: Optional[str], dry_run: dict) -> tuple[str, str]:
    """
    model_confidence: the LLM's own self-reported "confidence" field
                       ("safe_to_merge" / "needs_human_review" / anything else)
    dry_run:           dict with "attempted" (bool) and "passed" (bool | None),
                        as produced by dry_run.run_python_tests_dry_run() or
                        the not-implemented stub for other recipes.

    Returns (confidence, confidence_reason).
    """
    attempted = dry_run.get("attempted", False)
    passed = dry_run.get("passed")

    if not attempted:
        return (
            "needs_human_review",
            "Dry-run verification isn't available for this recipe yet, "
            "so this result can't be independently confirmed.",
        )

    if passed is False:
        return (
            "needs_human_review",
            "The generated tests failed during dry-run execution.",
        )

    if model_confidence != "safe_to_merge":
        return (
            "needs_human_review",
            "The model itself flagged this change as needing review.",
        )

    # Both signals agree: dry-run passed AND the model self-reports safe.
    return (
        "safe_to_merge",
        "Dry-run tests passed and the model reported no complex logical "
        "changes were needed.",
    )