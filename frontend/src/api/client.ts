import type {
  MigrationRoadmapRequest,
  MigrationRoadmapResponse,
  RecipeId,
  RefactorRepoRequest,
  RefactorRepoResponse,
  RefactorRequest,
  RefactorResponse,
} from '../types/migration';

// In dev, vite.config.ts proxies /api -> http://localhost:8000 so we never
// hardcode a host here. Override with VITE_API_BASE for a real deployment.
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Network-level failure (backend not running, CORS, offline).
    throw new ApiError(0, 'Could not reach the backend. Is it running on port 8000?');
  }

  if (!res.ok) {
    // FastAPI's HTTPException body shape: {"detail": "..."}
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      /* body wasn't JSON — keep the generic message */
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<TRes>;
}

export function refactorSnippet(
  code: string,
  recipe: RecipeId,
  filename?: string
): Promise<RefactorResponse> {
  const payload: RefactorRequest = { code, recipe, filename };
  return post<RefactorRequest, RefactorResponse>('/refactor', payload);
}

export function refactorRepo(
  recipe: RecipeId,
  files: { filename: string; code: string }[]
): Promise<RefactorRepoResponse> {
  const payload: RefactorRepoRequest = { recipe, files };
  return post<RefactorRepoRequest, RefactorRepoResponse>('/refactor-repo', payload);
}

/**
 * Layer 6b. Takes /refactor-repo's own per-file results plus the original
 * files, and returns a ranked plan.
 *
 * The `files` are sent again on purpose even though the client already has
 * them: the backend rebuilds the Layer 6a dependency graph from that source
 * code on every call rather than trusting a map from the client, so nobody
 * can hand the UI a fabricated set of dependencies.
 *
 * Ranking a repo needs at least two files, and the backend requires
 * `files` and `results` to correspond 1:1 — it answers 400 otherwise. So
 * pass exactly the results that came back from /refactor-repo for exactly
 * the files you are sending.
 */
export function migrationRoadmap(
  recipe: RecipeId,
  files: { filename: string; code: string }[],
  results: RefactorResponse[]
): Promise<MigrationRoadmapResponse> {
  const payload: MigrationRoadmapRequest = { recipe, files, results };
  return post<MigrationRoadmapRequest, MigrationRoadmapResponse>('/migration-roadmap', payload);
}
