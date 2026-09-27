import json
import unittest
from unittest.mock import patch

from app.roadmap import call_roadmap, _validate
from app.llm_client import LLMParseError


class TestMigrationRoadmap(unittest.TestCase):

    @patch("app.roadmap._call_openrouter")
    def test_repo_one_javascript_roadmap(self, mock_llm):
        dependency_map = {
            "core.js": {
                "depends_on": [],
                "depended_on_by": ["api.js", "worker.js"],
                "in_degree": 2,
                "out_degree": 0,
            },
            "api.js": {
                "depends_on": ["core.js"],
                "depended_on_by": [],
                "in_degree": 0,
                "out_degree": 1,
            },
            "worker.js": {
                "depends_on": ["core.js"],
                "depended_on_by": [],
                "in_degree": 0,
                "out_degree": 1,
            },
        }

        summaries = [
            {
                "file": "core.js",
                "confidence": "needs_human_review",
                "security_notes": "Review carefully.",
            },
            {
                "file": "api.js",
                "confidence": "safe_to_merge",
                "security_notes": "",
            },
            {
                "file": "worker.js",
                "confidence": "safe_to_merge",
                "security_notes": "",
            },
        ]

        mock_llm.return_value = json.dumps(
            {
                "roadmap": [
                    {
                        "file": "core.js",
                        "priority": 1,
                        "risk_level": "high",
                        "reasoning": "Core file has the largest blast radius.",
                        "risk_commentary": "api.js and worker.js depend on it.",
                    },
                    {
                        "file": "api.js",
                        "priority": 2,
                        "risk_level": "low",
                        "reasoning": "API depends on core.js.",
                        "risk_commentary": "Nothing in this repo depends on it.",
                    },
                    {
                        "file": "worker.js",
                        "priority": 3,
                        "risk_level": "low",
                        "reasoning": "Worker depends on core.js.",
                        "risk_commentary": "Nothing in this repo depends on it.",
                    },
                ]
            }
        )

        result = call_roadmap(
            summaries,
            dependency_map,
            max_retries=0,
        )

        roadmap = result["roadmap"]

        self.assertEqual(len(roadmap), 3)

        self.assertEqual(
            [item["priority"] for item in roadmap],
            [1, 2, 3],
        )

        core = roadmap[0]

        self.assertEqual(core["file"], "core.js")
        self.assertEqual(core["risk_level"], "high")

        # These values must come from deterministic dependency analysis,
        # not from the AI response.
        self.assertEqual(
            core["depended_on_by"],
            ["api.js", "worker.js"],
        )
        self.assertEqual(core["depends_on"], [])
        self.assertEqual(core["in_degree"], 2)
        self.assertEqual(core["out_degree"], 0)

    @patch("app.roadmap._call_openrouter")
    def test_repo_two_python_roadmap(self, mock_llm):
        dependency_map = {
            "utils.py": {
                "depends_on": [],
                "depended_on_by": ["service.py"],
                "in_degree": 1,
                "out_degree": 0,
            },
            "service.py": {
                "depends_on": ["utils.py"],
                "depended_on_by": [],
                "in_degree": 0,
                "out_degree": 1,
            },
        }

        summaries = [
            {
                "file": "utils.py",
                "confidence": "safe_to_merge",
                "security_notes": "",
            },
            {
                "file": "service.py",
                "confidence": "needs_human_review",
                "security_notes": "Manual review recommended.",
            },
        ]

        mock_llm.return_value = json.dumps(
            {
                "roadmap": [
                    {
                        "file": "utils.py",
                        "priority": 1,
                        "risk_level": "medium",
                        "reasoning": "service.py depends on utils.py.",
                        "risk_commentary": "service.py may need updating.",
                    },
                    {
                        "file": "service.py",
                        "priority": 2,
                        "risk_level": "low",
                        "reasoning": "Nothing depends on service.py.",
                        "risk_commentary": "Nothing in this repo depends on it.",
                    },
                ]
            }
        )

        result = call_roadmap(
            summaries,
            dependency_map,
            max_retries=0,
        )

        roadmap = result["roadmap"]

        self.assertEqual(len(roadmap), 2)

        self.assertEqual(roadmap[0]["file"], "utils.py")
        self.assertEqual(roadmap[0]["priority"], 1)
        self.assertEqual(roadmap[0]["risk_level"], "medium")

        self.assertEqual(
            roadmap[0]["depended_on_by"],
            ["service.py"],
        )

        self.assertEqual(
            roadmap[1]["depends_on"],
            ["utils.py"],
        )

    def test_rejects_missing_file(self):
        bad_response = {
            "roadmap": [
                {
                    "file": "a.js",
                    "priority": 1,
                }
            ]
        }

        with self.assertRaises(LLMParseError):
            _validate(
                bad_response,
                ["a.js", "b.js"],
            )

    def test_rejects_invalid_priority_sequence(self):
        bad_response = {
            "roadmap": [
                {
                    "file": "a.js",
                    "priority": 1,
                },
                {
                    "file": "b.js",
                    "priority": 3,
                },
            ]
        }

        with self.assertRaises(LLMParseError):
            _validate(
                bad_response,
                ["a.js", "b.js"],
            )


if __name__ == "__main__":
    unittest.main()