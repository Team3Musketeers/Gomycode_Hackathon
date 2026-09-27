import type {
  RefactorResponse,
  RoadmapEntry,
} from '../types/migration';

interface RepoOverviewProps {
  results: RefactorResponse[];
  failed: { filename: string; error: string }[];
  roadmap: RoadmapEntry[];
  onOpenResults: () => void;
  onOpenRoadmap: () => void;
}

export function RepoOverview({
  results,
  failed,
  roadmap,
  onOpenResults,
  onOpenRoadmap,
}: RepoOverviewProps) {
  const total = results.length + failed.length;

  const safeToMerge = results.filter(
    (result) => result.confidence === 'safe_to_merge'
  ).length;

  const needsReview = results.filter(
    (result) => result.confidence === 'needs_human_review'
  ).length;

  const highRisk = roadmap.filter(
    (entry) => entry.risk_level === 'high'
  ).length;

  return (
    <section className="space-y-4">
      <div className="rounded-md border border-border bg-surface p-5">
        <div className="mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Repository analysis
          </p>

          <h3 className="mt-1 font-sans text-lg font-semibold text-ink">
            Repository overview
          </h3>

          <p className="mt-1 text-xs text-muted">
            A summary of the migration status before inspecting individual
            files.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric
            label="Total files"
            value={total}
          />

          <Metric
            label="Analysed"
            value={results.length}
          />

          <Metric
            label="Safe to merge"
            value={safeToMerge}
            tone="safe"
          />

          <Metric
            label="Human review"
            value={needsReview}
            tone="warning"
          />

          <Metric
            label="Failed"
            value={failed.length}
            tone={failed.length ? 'danger' : 'normal'}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-faint">
            Migration roadmap
          </p>

          {roadmap.length > 0 ? (
            <>
              <p className="mt-2 text-sm text-ink">
                {roadmap.length} files ranked for migration.
              </p>

              <p className="mt-1 text-xs text-muted">
                {highRisk} high-risk file{highRisk === 1 ? '' : 's'} identified
                from dependency blast radius.
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted">
              The roadmap has not been generated yet.
            </p>
          )}

          <button
            type="button"
            onClick={onOpenRoadmap}
            className="mt-4 rounded border border-signal/50 px-3 py-1.5 font-sans text-xs text-signal hover:bg-signal/10"
          >
            {roadmap.length > 0 ? 'Open roadmap' : 'Build roadmap'}
          </button>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-faint">
            Per-file analysis
          </p>

          <p className="mt-2 text-sm text-ink">
            Inspect generated code, tests, security notes and confidence.
          </p>

          <p className="mt-1 text-xs text-muted">
            {results.length} successful result
            {results.length === 1 ? '' : 's'} available.
          </p>

          <button
            type="button"
            onClick={onOpenResults}
            className="mt-4 rounded border border-border px-3 py-1.5 font-sans text-xs text-muted hover:border-signal hover:text-ink"
          >
            Open file results
          </button>
        </div>
      </div>

      {failed.length > 0 && (
        <div className="rounded-md border border-danger/40 bg-danger/10 p-4">
          <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-danger">
            Files requiring attention
          </p>

          <div className="space-y-2">
            {failed.map((item) => (
              <div
                key={item.filename}
                className="font-mono text-xs text-danger"
              >
                {item.filename}: {item.error}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: number;
  tone?: 'normal' | 'safe' | 'warning' | 'danger';
}) {
  const toneClass = {
    normal: 'text-ink',
    safe: 'text-safe',
    warning: 'text-signal',
    danger: 'text-danger',
  }[tone];

  return (
    <div className="rounded border border-border bg-surface-raised p-3">
      <p className={`font-mono text-xl ${toneClass}`}>
        {value}
      </p>

      <p className="mt-1 text-[10px] uppercase tracking-wide text-faint">
        {label}
      </p>
    </div>
  );
}