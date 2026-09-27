import { cn } from '../../utils/cn';
import type { Mode } from '../../types/migration';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  repoFileCount: number;
}

const options: { id: Mode; label: string; hint: string }[] = [
  { id: 'snippet', label: 'Single snippet', hint: '1 file, fixed in isolation' },
  { id: 'repo', label: 'Small repo', hint: '2\u20135 files, ranked against each other' },
];

export function ModeToggle({ mode, onChange, repoFileCount }: ModeToggleProps) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Input mode">
      {options.map((opt) => {
        const active = opt.id === mode;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex-1 rounded-md border px-4 py-3 text-left transition-colors',
              active
                ? 'border-signal bg-surface-raised text-ink'
                : 'border-border bg-surface text-muted hover:border-faint hover:text-ink'
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-sans text-sm font-medium">{opt.label}</span>
              {opt.id === 'repo' && repoFileCount > 0 && (
                <span className="font-mono text-xs text-faint">{repoFileCount} added</span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-faint">{opt.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
