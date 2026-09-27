import { useRef } from 'react';
import { useFileDrop } from '../../hooks/useFileDrop';
import { cn } from '../../utils/cn';
import type { Recipe } from '../../types/migration';

interface FileDropZoneProps {
  recipe: Recipe;
  disabled: boolean;
  onFiles: (files: FileList) => void;
}

export function FileDropZone({ recipe, disabled, onFiles }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isOver, onDragOver, onDragLeave, onDrop } = useFileDrop(onFiles);

  return (
    <div
      onDragOver={disabled ? undefined : onDragOver}
      onDragLeave={disabled ? undefined : onDragLeave}
      onDrop={disabled ? undefined : onDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        isOver ? 'border-signal bg-signal/5' : 'border-border bg-surface'
      )}
    >
      <p className="font-sans text-sm text-muted">
        Drop {recipe.extensions.join(', ')} files here, or
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="rounded-sm border border-border px-3 py-1.5 font-sans text-xs font-medium text-ink hover:border-signal hover:text-signal disabled:cursor-not-allowed"
      >
        Choose files
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={recipe.accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
