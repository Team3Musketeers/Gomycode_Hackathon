import type { RoadmapEntry } from '../types/migration';

/**
 * Layer 6b/7 — the Migration Roadmap screen.
 *
 * This is the demo's centerpiece and, until now, the one piece of data the
 * backend returned that the frontend never actually showed: `priority`,
 * `risk_level`, `reasoning` and `risk_commentary` were typed and plumbed
 * through App.tsx only to be discarded in favor of the dependency arrays.
 * Everything below is the LLM's comparative judgment (Job 2) grounded in the
 * deterministic graph from Layer 6a — that provenance split is called out in
 * the UI itself, not just the docs, since that's the whole "not vibes alone"
 * pitch.
 */
export interface RoadmapViewProps {
  entries: RoadmapEntry[];
  selectedFile: string | null;
  onSelect: (filename: string) => void;
}

const riskStyle: Record<RoadmapEntry['risk_level'], string> = {
  low: 'text-safe border-safe/40 bg-safe/10',
  medium: 'text-signal border-signal/40 bg-signal/10',
  high: 'text-danger border-danger/40 bg-danger/10',
};

export function RoadmapView({ entries, selectedFile, onSelect }: RoadmapViewProps) {
  if (entries.length === 0) {
    return <p className="text-xs text-faint">No roadmap yet.</p>;
  }

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted">
          Migration roadmap — fix in this order
        </h3>
        <span className="font-mono text-[10px] text-faint">
          ranking + risk note: AI · dependency counts: parsed
        </span>
      </div>

      <ul className="divide-y divide-border">
        {entries.map((entry) => {
          const active = entry.file === selectedFile;
          return (
            <li key={entry.file}>
              <button
                type="button"
                onClick={() => onSelect(entry.file)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                  active ? 'bg-surface-raised' : 'hover:bg-surface-raised/60'
                }`}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted">
                  {entry.priority}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink">{entry.file}</span>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${riskStyle[entry.risk_level]}`}
                    >
                      {entry.risk_level} risk
                    </span>
                    <span className="font-mono text-[10px] text-faint">
                      in {entry.in_degree} / out {entry.out_degree}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{entry.reasoning}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
