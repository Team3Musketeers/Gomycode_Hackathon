import { useMemo } from 'react';
import type { MigrationForm } from '../../hooks/useMigrationForm';
import { ModeToggle } from './ModeToggle';
import { RecipePicker } from './RecipePicker';
import { SnippetEditor } from './SnippetEditor';
import { RepoFilePanel } from './RepoFilePanel';
import { SubmitBar } from './SubmitBar';

interface InputScreenProps {
  form: MigrationForm;
}

/**
 * Layer 7 (Person A): the entry point for both input modes.
 *   - "snippet" -> POST /refactor
 *   - "repo"    -> POST /refactor-repo
 * On success, `form`'s onSubmitted callback (wired by the parent) hands the
 * response off to Person B's FileResultView / Person C's RepoOverview +
 * Migration Roadmap screens. This screen owns getting valid input to the
 * backend — nothing past that.
 */
export function InputScreen({ form }: InputScreenProps) {
  const submitLabel = useMemo(
    () => (form.mode === 'snippet' ? 'Refactor this file' : `Refactor & build roadmap`),
    [form.mode]
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-xl font-semibold text-ink">Legacy Migrate</h1>
        <p className="font-sans text-sm text-muted">
          Paste one file, or bring a small repo and get a prioritized migration plan.
        </p>
      </header>

      <ModeToggle mode={form.mode} onChange={form.setMode} repoFileCount={form.files.length} />

      <RecipePicker recipes={form.recipes} value={form.recipeId} onChange={form.setRecipe} />

      {form.mode === 'snippet' ? (
        <SnippetEditor
          recipe={form.recipe}
          filename={form.snippetFilename}
          code={form.snippetCode}
          onFilenameChange={form.updateSnippetFilename}
          onCodeChange={form.updateSnippetCode}
        />
      ) : (
        <RepoFilePanel
          recipe={form.recipe}
          files={form.files}
          fileIssues={form.fileIssues}
          maxFiles={form.MAX_REPO_FILES}
          onAddEmpty={form.addEmptyFile}
          onAddFromFileList={form.addFromFileList}
          onChange={form.updateFile}
          onRemove={form.removeFile}
        />
      )}

      <SubmitBar
        blockingReason={form.blockingReason}
        errorMessage={form.errorMessage}
        isSubmitting={form.isSubmitting}
        submitLabel={submitLabel}
        onSubmit={form.submit}
        onLoadExample={form.loadExample}
      />
    </div>
  );
}
