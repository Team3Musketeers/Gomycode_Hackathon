import { FileDropZone } from './FileDropZone';
import { RepoFileRow } from './RepoFileRow';
import type { FileIssue, Recipe, RepoFileDraft } from '../../types/migration';

interface RepoFilePanelProps {
  recipe: Recipe;
  files: RepoFileDraft[];
  fileIssues: Record<string, FileIssue>;
  maxFiles: number;
  onAddEmpty: () => void;
  onAddFromFileList: (list: FileList) => void;
  onChange: (id: string, patch: Partial<Omit<RepoFileDraft, 'id'>>) => void;
  onRemove: (id: string) => void;
}

export function RepoFilePanel({
  recipe,
  files,
  fileIssues,
  maxFiles,
  onAddEmpty,
  onAddFromFileList,
  onChange,
  onRemove,
}: RepoFilePanelProps) {
  const atLimit = files.length >= maxFiles;

  return (
    <div className="flex flex-col gap-3">
      {files.map((file, i) => (
        <RepoFileRow
          key={file.id}
          file={file}
          index={i}
          issue={fileIssues[file.id]}
          canRemove={true}
          onChange={(patch) => onChange(file.id, patch)}
          onRemove={() => onRemove(file.id)}
        />
      ))}

      {!atLimit && (
        <div className="flex flex-col gap-2">
          <FileDropZone recipe={recipe} disabled={atLimit} onFiles={onAddFromFileList} />
          <button
            type="button"
            onClick={onAddEmpty}
            className="self-start font-sans text-xs text-muted hover:text-signal"
          >
            + Add an empty file to paste into
          </button>
        </div>
      )}

      {atLimit && (
        <p className="font-sans text-xs text-faint">
          {maxFiles} files is the limit for this demo &mdash; remove one to add another.
        </p>
      )}
    </div>
  );
}
