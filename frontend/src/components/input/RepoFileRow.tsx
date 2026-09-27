import { cn } from '../../utils/cn';
import type { FileIssue, RepoFileDraft } from '../../types/migration';

interface RepoFileRowProps {
  file: RepoFileDraft;
  index: number;
  issue?: FileIssue;
  canRemove: boolean;
  onChange: (patch: Partial<Omit<RepoFileDraft, 'id'>>) => void;
  onRemove: () => void;
}

export function RepoFileRow({ file, index, issue, canRemove, onChange, onRemove }: RepoFileRowProps) {
  return (
    <div
      className={cn(
        'rounded-md border bg-surface',
        issue ? 'border-danger/50' : 'border-border'
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-3 py-1.5">
        <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, '0')}</span>
        <input
          value={file.filename}
          onChange={(e) => onChange({ filename: e.target.value })}
          placeholder="filename.ext"
          className="flex-1 bg-transparent font-mono text-xs text-ink placeholder:text-faint focus:outline-none"
          aria-label={`Filename for file ${index + 1}`}
        />
        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="font-sans text-xs text-faint hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Remove file ${index + 1}`}
        >
          Remove
        </button>
      </div>
      <textarea
        value={file.code}
        onChange={(e) => onChange({ code: e.target.value })}
        rows={6}
        spellCheck={false}
        placeholder="Paste this file's code here."
        className="w-full resize-y bg-surface px-3 py-2 font-mono text-xs leading-6 text-ink placeholder:text-faint focus:outline-none"
      />
      {issue?.filename && <div className="border-t border-border px-3 py-1.5 font-sans text-xs text-danger">{issue.filename}</div>}
    </div>
  );
}
