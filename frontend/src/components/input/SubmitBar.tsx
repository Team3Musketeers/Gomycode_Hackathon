import { cn } from '../../utils/cn';

interface SubmitBarProps {
  blockingReason: string | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onLoadExample: () => void;
}

export function SubmitBar({
  blockingReason,
  errorMessage,
  isSubmitting,
  submitLabel,
  onSubmit,
  onLoadExample,
}: SubmitBarProps) {
  return (
    <div className="flex flex-col gap-2">
      {errorMessage && (
        <div className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 font-sans text-xs text-danger">
          {errorMessage}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onLoadExample}
          className="font-sans text-xs text-muted hover:text-ink"
        >
          Load example
        </button>
        <div className="flex items-center gap-3">
          {blockingReason && !isSubmitting && (
            <span className="font-sans text-xs text-faint">{blockingReason}</span>
          )}
          <button
            type="button"
            disabled={!!blockingReason || isSubmitting}
            onClick={onSubmit}
            className={cn(
              'rounded-md px-5 py-2 font-sans text-sm font-medium transition-colors',
              blockingReason || isSubmitting
                ? 'cursor-not-allowed bg-surface-raised text-faint'
                : 'bg-signal text-bg hover:bg-signal/90'
            )}
          >
            {isSubmitting ? 'Sending to model\u2026' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
