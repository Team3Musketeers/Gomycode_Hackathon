import { useState } from 'react';
import type { RefactorResponse } from '../types/migration';

/**
 * Layer 7c — the per-file dependency panel.
 *
 * Everything shown here is parsed out of the source by Layer 6a, not asked
 * of a model: `depends_on` is what this file imports, `depended_on_by` is
 * what imports it, and the two degrees are just their lengths. That is the
 * whole point of the panel — a judge can check any claim on it by opening
 * the files, so it is worth showing which half of the screen is proven and
 * which half is the LLM's opinion.
 */
export interface DependencyPanelProps {
  filename?: string | null;
  dependsOn?: string[];
  dependedOnBy?: string[];
  /** Layer 6b's one-sentence AI risk note for this file — not from Layer 6a. */
  riskCommentary?: string;
  onSelectFile?: (filename: string) => void;
}

function FileList({
  files,
  empty,
  tone,
  onSelectFile,
}: {
  files: string[];
  empty: string;
  tone: 'up' | 'down';
  onSelectFile?: (filename: string) => void;
}) {
  if (files.length === 0) {
    return <p className="text-xs text-faint">{empty}</p>;
  }
  return (
    <ul className="space-y-1">
      {files.map((f) => (
        <li key={f}>
          {onSelectFile ? (
            <button
              type="button"
              onClick={() => onSelectFile(f)}
              className="font-mono text-xs text-ink underline decoration-border underline-offset-2 hover:decoration-signal"
            >
              {f}
            </button>
          ) : (
            <span className="font-mono text-xs text-ink">{f}</span>
          )}
          {tone === 'up' && <span className="ml-2 text-[10px] text-faint">must be migrated first</span>}
          {tone === 'down' && <span className="ml-2 text-[10px] text-faint">breaks if this changes</span>}
        </li>
      ))}
    </ul>
  );
}

export function DependencyPanel({
  filename,
  dependsOn = [],
  dependedOnBy = [],
  riskCommentary,
  onSelectFile,
}: DependencyPanelProps) {
  const inDegree = dependedOnBy.length;
  const outDegree = dependsOn.length;

  return (
    <div className="rounded-md border border-border bg-surface-raised p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted">
          Blast radius
        </h4>
        <span className="font-mono text-[10px] text-faint">parsed, not predicted</span>
      </div>

      <div className="mb-3 flex gap-4">
        <div>
          <span className="font-mono text-lg text-signal">{inDegree}</span>
          <span className="ml-1.5 text-[10px] text-muted">depended on by</span>
        </div>
        <div>
          <span className="font-mono text-lg text-muted">{outDegree}</span>
          <span className="ml-1.5 text-[10px] text-muted">depends on</span>
        </div>
      </div>

      {riskCommentary && (
        <p className="mb-3 rounded border border-signal/30 bg-signal/10 px-3 py-2 text-xs text-ink">
          <span className="mr-1.5 font-mono text-[10px] uppercase text-signal">AI risk note</span>
          {riskCommentary}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-faint">Depends on</p>
          <FileList files={dependsOn} tone="up" empty="Nothing — this file imports no sibling." onSelectFile={onSelectFile} />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-faint">Depended on by</p>
          <FileList files={dependedOnBy} tone="down" empty="Nothing — no file in this repo imports it." onSelectFile={onSelectFile} />
        </div>
      </div>

      {inDegree === 0 && dependedOnBy.length === 0 && dependsOn.length === 0 && (
        <p className="mt-3 text-[10px] text-faint">
          No cross-file references matched for {filename ?? 'this file'}.
        </p>
      )}
    </div>
  );
}

type Tab = 'code' | 'tests' | 'security';

export interface FileResultViewProps {
  result: RefactorResponse;
  /**
   * Layer 6a data for this file. Left undefined when the dependency graph has
   * not been fetched, and the Blast radius panel is then hidden entirely —
   * rendering it with empty arrays would put a confident "0 depended on by"
   * next to the words "parsed, not predicted", which is a claim we have not
   * actually earned. Showing nothing is the honest option.
   */
  dependsOn?: string[];
  dependedOnBy?: string[];
  riskCommentary?: string;
  onBack?: () => void;
  onSelectFile?: (filename: string) => void;
}

const confidenceStyle: Record<string, string> = {
  safe_to_merge: 'text-safe border-safe/40 bg-safe/10',
  needs_human_review: 'text-signal border-signal/40 bg-signal/10',
};

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="mb-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h4>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink">{body}</p>
    </div>
  );
}

export function FileResultView({
  result,
  dependsOn,
  dependedOnBy,
  riskCommentary,
  onBack,
  onSelectFile,
}: FileResultViewProps) {
  const [tab, setTab] = useState<Tab>('code');
  const filename = result.filename ?? '(snippet)';
  const hasGraph = dependsOn !== undefined || dependedOnBy !== undefined;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'code', label: 'Refactored code' },
    { id: 'tests', label: 'Generated tests' },
    { id: 'security', label: 'Security notes' },
  ];

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-ink">{filename}</span>
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
              confidenceStyle[result.confidence] ?? 'text-muted border-border'
            }`}
          >
            {result.confidence}
          </span>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="font-sans text-xs text-muted hover:text-ink"
          >
            &larr; Back
          </button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {result.confidence_reason && (
          <p className="rounded border border-border bg-surface-raised px-3 py-2 text-xs text-muted">
            <span className="text-faint">Why this confidence: </span>
            {result.confidence_reason}
          </p>
        )}

        <Section title="What changed" body={result.explanation} />

        {hasGraph && (
          <DependencyPanel
            filename={result.filename}
            dependsOn={dependsOn}
            dependedOnBy={dependedOnBy}
            riskCommentary={riskCommentary}
            onSelectFile={onSelectFile}
          />
        )}

        <div>
          <div className="mb-2 flex gap-1 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-2.5 py-1.5 font-sans text-xs transition-colors ${
                  tab === t.id
                    ? 'border-signal text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-border bg-bg p-3 font-mono text-xs leading-relaxed text-ink">
            {tab === 'code' ? result.refactored_code : tab === 'tests' ? result.tests : result.security_notes}
          </pre>
        </div>

        {result.dry_run?.attempted && (
          <div
            className={`rounded border px-3 py-2 font-mono text-[10px] ${
              result.dry_run.passed
                ? 'border-safe/40 bg-safe/10 text-safe'
                : 'border-danger/40 bg-danger/10 text-danger'
            }`}
          >
            dry run {result.dry_run.passed ? 'passed' : 'failed'}
            {result.dry_run.output && ` — ${result.dry_run.output.slice(0, 200)}`}
          </div>
        )}
      </div>
    </div>
  );
}
