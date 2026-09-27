"""
Layer 2 stretch: actually execute generated Python tests in a disposable
sandbox, instead of only displaying them as text. This is the "dry run"
framing from the plan — nothing here ever touches the user's real code.

Scope: python2to3 recipe only for now. js_callback_async tests would need a
Node sandbox, which isn't wired up — that's a stated limitation, not a bug.
"""

import os
import subprocess
import sys
import tempfile


def run_python_tests_dry_run(tests_code: str, timeout: int = 10) -> dict:
    """
    Writes the generated test code to an isolated temp directory and runs it
    as a subprocess with a timeout. Returns:
        {"attempted": bool, "passed": bool | None, "output": str}
    `passed` is None only when we never got far enough to execute anything
    (e.g. couldn't write the file).
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        test_path = os.path.join(tmpdir, "test_dry_run.py")

        try:
            with open(test_path, "w") as f:
                f.write(tests_code)
        except OSError as e:
            return {"attempted": False, "passed": None, "output": f"Could not write test file: {e}"}

        try:
            proc = subprocess.run(
                [sys.executable, test_path],  # cross-platform: works on Windows too, unlike a hardcoded "python3"
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            return {
                "attempted": True,
                "passed": False,
                "output": f"Dry run timed out after {timeout}s",
            }
        except OSError as e:
            return {"attempted": False, "passed": None, "output": f"Could not run dry run: {e}"}

        output = (proc.stdout + proc.stderr)
        if len(output) > 2000:
            output = output[-2000:]  # keep the tail — that's where failures show up

        return {
            "attempted": True,
            "passed": proc.returncode == 0,
            "output": output.strip(),
        }