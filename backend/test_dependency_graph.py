"""
Layer 6a hand-verification harness.

No server, no API key, no LLM - dependency_graph.py is pure regex parsing,
so this can and should be checked completely offline before it ever feeds
the roadmap prompt. Per the plan's Testing & Reliability Plan: "Verify the
in-degree/out-degree counts by hand against your actual 4-file demo repo
before trusting them live - a wrong dependency count undermines the entire
'real data, not vibes' pitch."

EXPECTED is transcribed from the comment header already written into each
demo-repo file (api.js, cli.js, storage.js, validator.js each state their
own expected in/out degree) - so this is checking the code against the
demo repo's own documented design, not against a number invented here.

Usage:
    python test_dependency_graph.py
    python test_dependency_graph.py --repo-dir ../demo-repo
"""

import argparse
import glob
import os
import sys

from app.dependency_graph import build_dependency_map

EXPECTED = {
    "api.js": {"in_degree": 0, "out_degree": 1, "depends_on": ["storage.js"], "depended_on_by": []},
    "cli.js": {"in_degree": 0, "out_degree": 1, "depends_on": ["storage.js"], "depended_on_by": []},
    "storage.js": {
        "in_degree": 2,
        "out_degree": 1,  # 'fs' is external and must NOT be counted - only validator.js
        "depends_on": ["validator.js"],
        "depended_on_by": ["api.js", "cli.js"],
    },
    "validator.js": {"in_degree": 1, "out_degree": 0, "depends_on": [], "depended_on_by": ["storage.js"]},
}


def load_repo(repo_dir: str) -> list:
    files = []
    for path in sorted(glob.glob(os.path.join(repo_dir, "*.js"))):
        with open(path, "r") as f:
            files.append({"filename": os.path.basename(path), "code": f.read()})
    return files


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-dir", default="../demo-repo")
    args = parser.parse_args()

    files = load_repo(args.repo_dir)
    if not files:
        print(f"[ERROR] No .js files found in {args.repo_dir}")
        return 1

    got = build_dependency_map(files)

    print("=" * 80)
    ok = True
    for filename, expected in EXPECTED.items():
        actual = got.get(filename)
        if actual is None:
            print(f"[MISSING] {filename} not found in demo repo / not parsed")
            ok = False
            continue

        row_ok = (
            actual["in_degree"] == expected["in_degree"]
            and actual["out_degree"] == expected["out_degree"]
            and actual["depends_on"] == expected["depends_on"]
            and actual["depended_on_by"] == expected["depended_on_by"]
        )
        ok = ok and row_ok
        status = "PASS" if row_ok else "FAIL"

        print(f"\n[{status}] {filename}")
        print(f"  expected: in={expected['in_degree']} out={expected['out_degree']} "
              f"depends_on={expected['depends_on']} depended_on_by={expected['depended_on_by']}")
        print(f"  actual:   in={actual['in_degree']} out={actual['out_degree']} "
              f"depends_on={actual['depends_on']} depended_on_by={actual['depended_on_by']}")

    print("\n" + "=" * 80)
    if ok:
        print("ALL PASS - dependency graph matches the demo repo's documented design.")
        print("storage.js should be the highest-in-degree file (2) - that's the")
        print("'this is your riskiest file' claim for the demo. validator.js has")
        print("in_degree=1/out_degree=0 - that's the 'safe, easy win' claim.")
    else:
        print("MISMATCH - do not trust this live until it's fixed. See FAIL rows above.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())