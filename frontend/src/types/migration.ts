// Mirrors backend/app/models.py. Keep these in lockstep with that file —
// the recipe ids in particular are the literal strings the backend's
// Literal["python2to3", "js_callback_to_async"] accepts.

export type RecipeId = 'python2to3' | 'js_callback_to_async';
export type Mode = 'snippet' | 'repo';
export type Confidence = 'safe_to_merge' | 'needs_human_review';

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

export type RunPhase = 'idle' | 'submitting' | 'error' | 'done';

export interface FileIssue {
  filename?: string;
  empty?: boolean;
}
