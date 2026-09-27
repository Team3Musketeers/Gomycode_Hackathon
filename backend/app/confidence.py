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


def derive_confidence(
    model_confidence: Optional[str],
    dry_run: dict,
) -> tuple[str, str]:
    """
    Derive the final confidence status from the model confidence
    and deterministic dry-run verification.

    Args:
        model_confidence:
            The LLM's self-reported confidence field.

            Expected values:
            - "safe_to_merge"
            - "needs_human_review"

            Any other value is treated conservatively.

        dry_run:
            Dictionary produced by the dry-run verification layer.

            Expected structure:
            {
                "attempted": bool,
                "passed": bool | None
            }

    Returns:
        tuple[str, str]:
            (
                confidence,
                confidence_reason
            )
    """

    attempted = dry_run.get("attempted", False)
    passed = dry_run.get("passed")

    # No deterministic verification was performed.
    if not attempted:
        return (
            "needs_human_review",
            "Dry-run verification isn't available for this recipe yet, "
            "so this result can't be independently confirmed.",
        )

    # A dry-run must explicitly return True.
    #
    # False means tests failed.
    # None means the result is unknown / incomplete.
    #
    # Neither case is sufficient for automatic approval.
    if passed is False:
        return (
            "needs_human_review",
            "The generated tests failed during dry-run execution.",
        )

    if passed is not True:
        return (
            "needs_human_review",
            "Dry-run verification did not produce a confirmed passing result.",
        )

    # Even when deterministic verification succeeds,
    # the model must also consider the migration safe.
    if model_confidence != "safe_to_merge":
        return (
            "needs_human_review",
            "The model itself flagged this change as needing review.",
        )

    # Both independent signals agree:
    #
    # 1. dry-run executed and passed
    # 2. model explicitly reported safe_to_merge
    return (
        "safe_to_merge",
        "Dry-run tests passed and the model reported no complex logical "
        "changes were needed.",
    )