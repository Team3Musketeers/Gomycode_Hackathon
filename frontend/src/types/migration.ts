// Mirrors backend/app/models.py. Keep these in lockstep with that file —
// the recipe ids in particular are the literal strings the backend's
// Literal["python2to3", "js_callback_to_async"] accepts.

export type RecipeId = 'python2to3' | 'js_callback_to_async';
export type Mode = 'snippet' | 'repo';
export type Confidence = 'safe_to_merge' | 'needs_human_review';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Recipe {
  id: RecipeId;
  label: string;
  from: string;
  to: string;
  accept: string; // file input "accept" attribute
  extensions: string[]; // for drag/drop + paste validation
  placeholder: string;
}

export interface RepoFileDraft {
  id: string; // client-only id, not sent to the backend
  filename: string;
  code: string;
}

// --- Request shapes sent to the backend ---

export interface RefactorRequest {
  code: string;
  recipe: RecipeId;
  filename?: string;
}

export interface RefactorRepoRequest {
  recipe: RecipeId;
  files: { filename: string; code: string }[];
}

// --- Response shapes returned by the backend ---

export interface DryRunResult {
  attempted: boolean;
  passed: boolean | null;
  output: string;
}

export interface RefactorResponse {
  filename?: string | null;
  recipe: RecipeId;
  refactored_code: string;
  explanation: string;
  tests: string;
  dry_run: DryRunResult;
  security_notes: string;
  confidence: Confidence;
  confidence_reason?: string | null;
}

export interface RefactorRepoResponse {
  results: RefactorResponse[];
  failed: { filename: string; error: string }[];
}

// --- Layer 6b: the Migration Roadmap ---

/**
 * One ranked file. The last four fields are NOT the model's opinion: the
 * backend copies them straight out of the deterministic Layer 6a graph, so
 * the roadmap screen and the per-file dependency panel can never disagree.
 * Only priority, risk_level, reasoning and risk_commentary come from the LLM.
 */
export interface RoadmapEntry {
  file: string;
  priority: number;
  risk_level: RiskLevel;
  reasoning: string;
  risk_commentary: string;
  depends_on: string[];
  depended_on_by: string[];
  in_degree: number;
  out_degree: number;
}

export interface MigrationRoadmapRequest {
  recipe: RecipeId;
  /** The same files sent to /refactor-repo — the backend rebuilds the 6a graph from these. */
  files: { filename: string; code: string }[];
  /** /refactor-repo's own output, so the per-file verdicts are not recomputed. */
  results: RefactorResponse[];
}

export interface MigrationRoadmapResponse {
  roadmap: RoadmapEntry[];
}

export type RunPhase = 'idle' | 'submitting' | 'error' | 'done';

export interface FileIssue {
  filename?: string;
  empty?: boolean;
}
