import type {
  RiskLevel,
  RoadmapEntry,
} from '../types/migration';

interface MigrationRoadmapProps {
  roadmap: RoadmapEntry[];
  selectedFile?: string | null;
  onSelectFile?: (filename: string) => void;
}

const riskStyle: Record<RiskLevel, string> = {
  low: 'border-safe/40 bg-safe/10 text-safe',
  medium: 'border-signal/40 bg-signal/10 text-signal',
  high: 'border-danger/40 bg-danger/10 text-danger',
};

export function MigrationRoadmap({
  roadmap,
  selectedFile,
  onSelectFile,
}: MigrationRoadmapProps) {
  const ordered = [...roadmap].sort(
    (a, b) => a.priority - b.priority
  );

  if (ordered.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-6 text-center">
        <p className="text-sm text-ink">
          No migration roadmap available.
        </p>

        <p className="mt-1 text-xs text-muted">
          Generate the repository roadmap to see migration priorities.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-faint">
          AI migration strategy
        </p>

        <h3 className="mt-1 font-sans text-lg font-semibold text-ink">
          Migration roadmap
        </h3>

        <p className="mt-1 max-w-2xl text-xs text-muted">
          Priority and commentary are advisory AI output. Dependency counts and
          blast-radius relationships come from deterministic source analysis.
        </p>
      </div>

      <div className="space-y-3">
        {ordered.map((entry) => {
          const active = selectedFile === entry.file;

          return (
            <article
              key={entry.file}
              className={`rounded-md border bg-surface p-4 transition-colors ${
                active
                  ? 'border-signal'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-raised font-mono text-xs text-ink">
                    {entry.priority}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectFile?.(entry.file)}
                      className="font-mono text-sm text-ink hover:text-signal"
                    >
                      {entry.file}
                    </button>

                    <p className="mt-0.5 text-[10px] text-faint">
                      in-degree {entry.in_degree}
                      {' · '}
                      out-degree {entry.out_degree}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${
                    riskStyle[entry.risk_level]
                  }`}
                >
                  {entry.risk_level} risk
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-faint">
                    Why this priority
                  </p>

                  <p className="text-xs leading-relaxed text-ink">
                    {entry.reasoning}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-faint">
                    Risk commentary
                  </p>

                  <p className="text-xs leading-relaxed text-ink">
                    {entry.risk_commentary}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                <DependencyList
                  title="Depends on"
                  files={entry.depends_on}
                />

                <DependencyList
                  title="Depended on by"
                  files={entry.depended_on_by}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DependencyList({
  title,
  files,
}: {
  title: string;
  files: string[];
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-faint">
        {title}
      </p>

      {files.length > 0 ? (
        <p className="font-mono text-[10px] text-muted">
          {files.join(', ')}
        </p>
      ) : (
        <p className="text-[10px] text-faint">
          None
        </p>
      )}
    </div>
  );
}