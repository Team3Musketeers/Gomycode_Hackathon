import { useCallback, useMemo, useState } from 'react';
import { refactorRepo, refactorSnippet, ApiError } from '../api/client';
import { MAX_REPO_FILES, MIN_REPO_FILES, findRecipe, recipes } from '../data/recipes';
import { samples } from '../data/samples';
import type {
  FileIssue,
  Mode,
  RecipeId,
  RefactorRepoResponse,
  RefactorResponse,
  RepoFileDraft,
  RunPhase,
} from '../types/migration';

let seq = 0;
const newId = () => `file-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export interface SubmitResult {
  mode: Mode;
  single?: RefactorResponse;
  repo?: RefactorRepoResponse;
}

interface UseMigrationFormOptions {
  // Handed the completed result so Layer 7's other screens (results view,
  // repo overview, roadmap) can pick it up — this hook/screen only owns
  // getting valid input to the backend, not rendering what comes back.
  onSubmitted?: (result: SubmitResult) => void;
}

export function useMigrationForm(options: UseMigrationFormOptions = {}) {
  const [mode, setModeState] = useState<Mode>('snippet');
  const [recipeId, setRecipeIdState] = useState<RecipeId>('python2to3');
  const [snippetFilename, setSnippetFilename] = useState('');
  const [snippetCode, setSnippetCode] = useState('');
  const [files, setFiles] = useState<RepoFileDraft[]>([]);
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recipe = findRecipe(recipeId);
  const isSubmitting = phase === 'submitting';

  const resetRun = useCallback(() => {
    setPhase('idle');
    setErrorMessage(null);
  }, []);

  const setMode = useCallback(
    (m: Mode) => {
      setModeState(m);
      resetRun();
    },
    [resetRun]
  );

  const setRecipe = useCallback(
    (id: RecipeId) => {
      setRecipeIdState(id);
      resetRun();
    },
    [resetRun]
  );

  const updateSnippetFilename = useCallback(
    (value: string) => {
      setSnippetFilename(value);
      resetRun();
    },
    [resetRun]
  );

  const updateSnippetCode = useCallback(
    (value: string) => {
      setSnippetCode(value);
      resetRun();
    },
    [resetRun]
  );

  const addEmptyFile = useCallback(() => {
    if (files.length >= MAX_REPO_FILES) return;
    setFiles((prev) => [...prev, { id: newId(), filename: '', code: '' }]);
    resetRun();
  }, [files.length, resetRun]);

  const addFromFileList = useCallback(
    async (list: FileList) => {
      const room = MAX_REPO_FILES - files.length;
      if (room <= 0) return;
      const picked = Array.from(list).slice(0, room);
      const entries = await Promise.all(
        picked.map(async (f) => ({ id: newId(), filename: f.name, code: await f.text() }))
      );
      setFiles((prev) => [...prev, ...entries].slice(0, MAX_REPO_FILES));
      resetRun();
    },
    [files.length, resetRun]
  );

  const updateFile = useCallback(
    (id: string, patch: Partial<Omit<RepoFileDraft, 'id'>>) => {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
      resetRun();
    },
    [resetRun]
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      resetRun();
    },
    [resetRun]
  );

  const loadExample = useCallback(() => {
    const sample = samples[recipeId];
    if (mode === 'snippet') {
      setSnippetFilename(sample.snippet.filename);
      setSnippetCode(sample.snippet.code);
    } else {
      setFiles(sample.repo.map((f) => ({ ...f, id: newId() })));
    }
    resetRun();
  }, [mode, recipeId, resetRun]);

  // Per-file problems: duplicate/missing names, empty bodies, wrong
  // extension for the chosen recipe — surfaced inline rather than only
  // at submit time.
  const fileIssues = useMemo(() => {
    const issues: Record<string, FileIssue> = {};
    const counts = new Map<string, number>();
    files.forEach((f) => {
      const key = f.filename.trim().toLowerCase();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    files.forEach((f) => {
      const issue: FileIssue = {};
      const name = f.filename.trim();
      if (!name && f.code.trim()) {
        issue.filename = 'Name this file so the dependency graph can trace imports.';
      } else if (name && (counts.get(name.toLowerCase()) ?? 0) > 1) {
        issue.filename = 'Another file already uses this name.';
      }
      if (!f.code.trim()) issue.empty = true;
      if (issue.filename || issue.empty) issues[f.id] = issue;
    });
    return issues;
  }, [files]);

  const blockingReason = useMemo((): string | null => {
    if (mode === 'snippet') {
      return snippetCode.trim() ? null : 'Paste the code you want to migrate.';
    }
    if (files.length === 0) {
      return `Add at least ${MIN_REPO_FILES} files to build a roadmap.`;
    }
    if (files.length < MIN_REPO_FILES) {
      const k = MIN_REPO_FILES - files.length;
      return `Add ${k} more file${k > 1 ? 's' : ''} \u2014 the roadmap ranks files against each other.`;
    }
    const empty = files.filter((f) => !f.code.trim()).length;
    if (empty) return `${empty} file${empty > 1 ? 's are' : ' is'} still empty.`;
    const naming = Object.values(fileIssues).filter((i) => i.filename).length;
    if (naming) return `${naming} file${naming > 1 ? 's need' : ' needs'} a unique name.`;
    return null;
  }, [mode, snippetCode, files, fileIssues]);

  const submit = useCallback(async () => {
    if (blockingReason || isSubmitting) return;
    setPhase('submitting');
    setErrorMessage(null);
    try {
      if (mode === 'snippet') {
        const result = await refactorSnippet(
          snippetCode,
          recipeId,
          snippetFilename.trim() || undefined
        );
        setPhase('done');
        options.onSubmitted?.({ mode, single: result });
      } else {
        const result = await refactorRepo(
          recipeId,
          files.map((f) => ({ filename: f.filename.trim(), code: f.code }))
        );
        setPhase('done');
        options.onSubmitted?.({ mode, repo: result });
      }
    } catch (err) {
      setPhase('error');
      setErrorMessage(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }, [blockingReason, isSubmitting, mode, snippetCode, recipeId, snippetFilename, files, options]);

  return {
    mode,
    setMode,
    recipes,
    recipe,
    recipeId,
    setRecipe,
    snippetFilename,
    updateSnippetFilename,
    snippetCode,
    updateSnippetCode,
    files,
    addEmptyFile,
    addFromFileList,
    updateFile,
    removeFile,
    fileIssues,
    loadExample,
    blockingReason,
    phase,
    isSubmitting,
    errorMessage,
    submit,
    MIN_REPO_FILES,
    MAX_REPO_FILES,
  };
}

export type MigrationForm = ReturnType<typeof useMigrationForm>;
