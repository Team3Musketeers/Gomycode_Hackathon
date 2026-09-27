# Legacy Migrate — Frontend (Layer 7)

## What's here

A Vite + React + TypeScript + Tailwind app. Currently implements:

- **`InputScreen`** (Person A, this layer) — snippet vs. repo mode toggle,
  recipe picker, snippet editor, repo file list with drag-drop/upload,
  inline validation, "Load example" (pulls the team's real sample files and
  `demo-repo/`), and submit — wired to the **real** backend, not mocked.
- A temporary `ResultsPreview` that dumps the raw JSON response so the app
  is demoable end to end today. **Delete this** once the real result
  screens below exist.

## Still to build (not this layer's job, listed for handoff)

- `FileResultView` (Person B) — diff, explanation, tests, security notes,
  confidence badge, per single-file result
- `RepoOverview` + `MigrationRoadmap` (Person C) — ranked list from
  `POST /migration-roadmap` once Layer 6b exists
- `BlastRadiusPanel` (Person C, Layer 6c) — dependency list + risk sentence
  per file, reusing the same roadmap response (no new endpoint)

To wire these in: replace `ResultsPreview` in `App.tsx` with routing based
on `result.mode` (`'snippet'` → `FileResultView`, `'repo'` → `RepoOverview`
→ `MigrationRoadmap`/`BlastRadiusPanel`). The `SubmitResult` type in
`src/hooks/useMigrationForm.ts` already carries everything they need
(`RefactorResponse` / `RefactorRepoResponse`, straight off the backend).

## Run it

```bash
cd frontend
npm install
npm run dev
```

Requires the backend running on `:8000` with a real `OPENROUTER_API_KEY`
in `backend/.env` (see `backend/README.md`). Vite proxies `/api` to it in
dev — the frontend never hardcodes a host (see `vite.config.ts`), so this
still works once it's behind a real reverse proxy later.

## Contract notes

- Recipe ids are `python2to3` and `js_callback_to_async` — must match
  `backend/app/models.py`'s `Recipe` literal exactly. If that changes,
  update `src/data/recipes.ts`.
- Repo mode caps at `MAX_REPO_FILES = 5` files client-side to keep the demo
  readable; the backend itself allows up to 10
  (`RefactorRepoRequest.files`, `max_length=10`).
- `MIN_REPO_FILES` is set to 2 here (the backend only requires 1). The
  plan document says 3–5 files for repo mode — bump this constant to 3 if
  the team wants to enforce that exactly.

## Type-check / build

```bash
npx tsc -b        # type-check only
npm run build     # full production build
```

Both pass clean as of this handoff.
