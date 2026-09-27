"""
Layer 6a: deterministic dependency graph (NO LLM involved).

This is the "provable, checkable" half of the product (Section 2/5 of the
plan): a plain regex pass over a small set of files, extracting
require()/import targets and turning them into an in-degree/out-degree map.
Job 2 (roadmap.get_roadmap_prompt) reasons ON TOP of this data - it does not
produce it. State that split explicitly in the demo; it's the Responsible AI
point.

Contract:
    build_dependency_map(files) -> {
        filename: {
            "depends_on":     [filenames this file requires/imports],
            "depended_on_by": [filenames that require/import this file],
            "out_degree":     len(depends_on)      -> how many files this one relies on
            "in_degree":      len(depended_on_by)  -> how many files break if this one changes
        }
    }
    `files` is the same shape as RefactorRepoRequest.files:
    list[{"filename": str, "code": str}] (or objects with those attributes -
    see _as_dict below, so it also accepts Pydantic RepoFile instances
    directly without the caller needing to convert them first).

Scope: only *local/relative* targets that resolve to another file IN THE
GIVEN SET count as an edge. A bare package import (require('fs'), Python's
`import os`, `import lodash`) is real but external - we have no visibility
into it and it isn't part of "what breaks in this repo if I touch this
file" - so it's deliberately excluded rather than mis-counted as blast
radius. This falls out naturally: an external target simply never matches
a filename in the set, no special-casing needed.

Verified by hand against backend/../demo-repo (see the comment header in
each of those 4 files, which states its expected in/out degree) - see
test_dependency_graph.py in this directory's parent for the check script.
Expected there: validator.js in=1/out=0, storage.js in=2/out=1,
api.js in=0/out=1, cli.js in=0/out=1.
"""

import re
from typing import Dict, List, Union

# --- CommonJS: require('./x') / require("./x") ---
_JS_REQUIRE_RE = re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""")

# --- ES modules: `import ... from './x'` and bare `import './x'` ---
_JS_IMPORT_RE = re.compile(r"""import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]""")

# --- Python: `from x import y` / `from .x import y` ---
_PY_FROM_RE = re.compile(r"""^\s*from\s+([\w.]+)\s+import\b""", re.MULTILINE)

# --- Python: `import x` / `import x.y` (not `import x as y`'s alias part) ---
_PY_IMPORT_RE = re.compile(r"""^\s*import\s+([\w.]+)""", re.MULTILINE)

_STRIPPABLE_EXTS = (".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".py")


def _as_dict(f: Union[dict, object]) -> dict:
    """Accept either a plain {"filename", "code"} dict or a RepoFile-like
    object with those attributes, so main.py can pass req.files straight
    through without a manual conversion step."""
    if isinstance(f, dict):
        return f
    return {"filename": f.filename, "code": f.code}


def _extract_raw_targets(code: str) -> List[str]:
    """Every raw require()/import target string found in one file's source.
    JS and Python patterns are both applied unconditionally - cheap, and in
    practice a given file only matches the patterns for its own language."""
    return (
        _JS_REQUIRE_RE.findall(code)
        + _JS_IMPORT_RE.findall(code)
        + _PY_FROM_RE.findall(code)
        + _PY_IMPORT_RE.findall(code)
    )


def _normalize(name: str) -> str:
    """Reduce a require()/import target OR an actual filename to a bare
    comparable stem, so require('./storage') and the file 'storage.js' land
    on the same key:
      './storage'        -> 'storage'
      '../lib/storage.js' -> 'storage'
      'storage.js'        -> 'storage'
      '.storage'  (python: `from .storage import x`) -> 'storage'
      'pkg.storage' (python: `from pkg.storage import x`) -> 'storage'
    Only the last path/dot segment is used for matching, which is the right
    granularity for a flat small-repo demo; a deeper package layout is a
    stated out-of-scope case, not a silent wrong answer (it just won't
    resolve to anything, so it's dropped as "external" - see module docstring).
    """
    stem = name.strip()
    stem = stem.lstrip("./")  # relative-path markers
    if "/" in stem:
        stem = stem.rsplit("/", 1)[-1]
    for ext in _STRIPPABLE_EXTS:
        if stem.endswith(ext):
            stem = stem[: -len(ext)]
            break
    if "." in stem:
        stem = stem.rsplit(".", 1)[-1]
    return stem


def build_dependency_map(files: List[Union[dict, object]]) -> Dict[str, dict]:
    file_dicts = [_as_dict(f) for f in files]

    # normalized stem -> real filename, so any spelling of a target that
    # reduces to the same stem resolves to the one file in this repo.
    stem_to_filename: Dict[str, str] = {}
    for f in file_dicts:
        stem_to_filename[_normalize(f["filename"])] = f["filename"]

    depends_on: Dict[str, List[str]] = {f["filename"]: [] for f in file_dicts}
    depended_on_by: Dict[str, List[str]] = {f["filename"]: [] for f in file_dicts}

    for f in file_dicts:
        filename = f["filename"]
        for raw_target in _extract_raw_targets(f["code"]):
            resolved = stem_to_filename.get(_normalize(raw_target))
            if resolved is None or resolved == filename:
                # None -> external package/module, not part of this repo's graph.
                # == filename -> a (harmless) self-import; not a real edge.
                continue
            if resolved not in depends_on[filename]:
                depends_on[filename].append(resolved)
            if filename not in depended_on_by[resolved]:
                depended_on_by[resolved].append(filename)

    return {
        filename: {
            "depends_on": sorted(depends_on[filename]),
            "depended_on_by": sorted(depended_on_by[filename]),
            "out_degree": len(depends_on[filename]),
            "in_degree": len(depended_on_by[filename]),
        }
        for filename in depends_on
    }