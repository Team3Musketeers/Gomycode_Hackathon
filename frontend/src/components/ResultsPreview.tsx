import type { SubmitResult } from '../hooks/useMigrationForm';

interface ResultsPreviewProps {
  result: SubmitResult;
  onBack: () => void;
}

/**
 * TEMPORARY. This is not Layer 7's FileResultView (Person B), RepoOverview
 * or MigrationRoadmap (Person C) — it just proves the InputScreen -> API
 * round trip works end to end while those screens don't exist yet. Delete
 * this once they land and route `onSubmitted` to the real screens instead.
 */
export function ResultsPreview({ result, onBack }: ResultsPreviewProps) {
  const items = result.single ? [result.single] : result.repo?.results ?? [];
  const failed = result.repo?.failed ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold text-ink">Raw result (placeholder view)</h2>
        <button
          type="button"
          onClick={onBack}
          className="font-sans text-xs text-muted hover:text-ink"
        >
          &larr; Back to input
        </button>
      </div>

      {items.map((r, i) => (
        <div key={i} className="rounded-md border border-border bg-surface p-4 font-mono text-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-ink">{r.filename ?? '(snippet)'}</span>
            <span className={r.confidence === 'safe_to_merge' ? 'text-safe' : 'text-signal'}>
              {r.confidence}
            </span>
          </div>
          <pre className="whitespace-pre-wrap text-muted">{r.explanation}</pre>
        </div>
      ))}

      {failed.map((f, i) => (
        <div key={i} className="rounded-md border border-danger/40 bg-danger/10 p-4 font-mono text-xs text-danger">
          {f.filename}: {f.error}
        </div>
      ))}
    </div>
  );
}
