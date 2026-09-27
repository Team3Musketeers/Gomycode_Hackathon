import unittest

from app.confidence import derive_confidence


class TestConfidenceLogic(unittest.TestCase):

    def test_no_dry_run_requires_human_review(self):
        confidence, reason = derive_confidence(
            "safe_to_merge",
            {"attempted": False, "passed": None},
        )

        self.assertEqual(confidence, "needs_human_review")
        self.assertIn("isn't available", reason)

    def test_failed_dry_run_requires_human_review(self):
        confidence, reason = derive_confidence(
            "safe_to_merge",
            {"attempted": True, "passed": False},
        )

        self.assertEqual(confidence, "needs_human_review")
        self.assertIn("failed", reason.lower())

    def test_model_requests_review(self):
        confidence, reason = derive_confidence(
            "needs_human_review",
            {"attempted": True, "passed": True},
        )

        self.assertEqual(confidence, "needs_human_review")
        self.assertIn("model", reason.lower())

    def test_passed_dry_run_and_safe_model_can_merge(self):
        confidence, reason = derive_confidence(
            "safe_to_merge",
            {"attempted": True, "passed": True},
        )

        self.assertEqual(confidence, "safe_to_merge")
        self.assertIn("passed", reason.lower())

    def test_unknown_dry_run_result_cannot_merge(self):
        confidence, reason = derive_confidence(
            "safe_to_merge",
            {"attempted": True, "passed": None},
        )

        self.assertEqual(confidence, "needs_human_review")


if __name__ == "__main__":
    unittest.main()