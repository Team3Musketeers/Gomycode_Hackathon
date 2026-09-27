import type { Recipe } from '../../types/migration';

interface SnippetEditorProps {
  recipe: Recipe;
  filename: string;
  code: string;
  onFilenameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
}

export function SnippetEditor({
  recipe,
  filename,
  code,
  onFilenameChange,
  onCodeChange,
}: SnippetEditorProps) {
  const lineCount = code ? code.split('\n').length : 1;

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-signal/70" />
        <input
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          placeholder={`untitled${recipe.extensions[0]}`}
          className="flex-1 bg-transparent font-mono text-xs text-ink placeholder:text-faint focus:outline-none"
          aria-label="Filename"
        />
        <span className="font-mono text-[11px] text-faint">optional</span>
      </div>
      <div className="relative flex">
        <div
          aria-hidden
          className="select-none border-r border-border bg-surface px-2 py-3 text-right font-mono text-xs leading-6 text-faint"
        >
          {Array.from({ length: Math.max(lineCount, 14) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder={recipe.placeholder}
          spellCheck={false}
          rows={14}
          className="min-h-[280px] flex-1 resize-y bg-surface px-3 py-3 font-mono text-xs leading-6 text-ink placeholder:text-faint focus:outline-none"
        />
      </div>
    </div>
  );
}
