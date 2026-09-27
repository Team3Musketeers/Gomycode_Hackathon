import { useState } from 'react';
import {
  useMigrationForm,
  type SubmitResult,
} from './hooks/useMigrationForm';

import { InputScreen } from './components/input/InputScreen';
import { FileResultView } from './components/FileResultView';
import { RepoOverview } from './components/RepoOverview';
import { MigrationRoadmap } from './components/MigrationRoadmap';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

import {
  migrationRoadmap,
  ApiError,
} from './api/client';

import {
  indexDependencies,
  type DependencyIndex,
} from './data/dependencyIndex';

import type {
  MigrationRoadmapResponse,
  RecipeId,
  RoadmapEntry,
} from './types/migration';

type Panel =
  | 'overview'
  | 'results'
  | 'dependencies'
  | 'roadmap';

export function App() {
  const [result, setResult] = useState<SubmitResult | null>(null);

  const [panel, setPanel] = useState<Panel>('results');
  const [selected, setSelected] = useState<string | null>(null);

  const [deps, setDeps] = useState<DependencyIndex>({});
  const [roadmap, setRoadmap] = useState<RoadmapEntry[]>([]);

  const [depError, setDepError] = useState<string | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const form = useMigrationForm({
    onSubmitted: (submitted) => {
      setResult(submitted);

      setPanel(
        submitted.mode === 'repo'
          ? 'overview'
          : 'results'
      );

      setSelected(null);
      setDeps({});
      setRoadmap([]);
      setDepError(null);
    },
  });

  const loadRoadmapData = async (
    r: SubmitResult,
    recipe: RecipeId,
    target: 'dependencies' | 'roadmap'
  ) => {
    if (!r.repo || !r.files?.length) {
      return;
    }

    if (roadmap.length > 0) {
      setPanel(target);

      if (!selected) {
        const first = [...roadmap].sort(
          (a, b) => a.priority - b.priority
        )[0];

        setSelected(first?.file ?? null);
      }

      return;
    }

    setLoadingRoadmap(true);
    setDepError(null);

    try {
      const response: MigrationRoadmapResponse =
        await migrationRoadmap(
          recipe,
          r.files,
          r.repo.results
        );

      setRoadmap(response.roadmap);
      setDeps(indexDependencies(response.roadmap));

      const first = [...response.roadmap].sort(
        (a, b) => a.priority - b.priority
      )[0];

      setSelected(first?.file ?? null);
      setPanel(target);
    } catch (err) {
      setDepError(
        err instanceof ApiError
          ? err.message
          : 'Could not build the migration roadmap.'
      );
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const items = result?.single
    ? [result.single]
    : result?.repo?.results ?? [];

  const failed = result?.repo?.failed ?? [];

  const current = selected
    ? items.find(
        (item) => item.filename === selected
      ) ?? null
    : null;

  if (!result) {
    return (
      <div className="min-h-screen w-full bg-bg text-ink antialiased">
        <InputScreen form={form} />
      </div>
    );
  }

  const reset = () => {
    setResult(null);
    setPanel('results');
    setSelected(null);
    setDeps({});
    setRoadmap([]);
    setDepError(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg text-ink antialiased">
      <Header
        subtitle={
          result.mode === 'repo'
            ? 'Repository results'
            : 'Snippet result'
        }
        action={
          <button
            type="button"
            onClick={reset}
            className="rounded border border-border px-3 py-1.5 font-sans text-xs text-muted hover:border-signal/40 hover:text-ink"
          >
            &larr; Back to input
          </button>
        }
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-10">
        {result.mode === 'repo' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1 rounded border border-border bg-surface p-0.5">
                <PanelButton
                  active={panel === 'overview'}
                  onClick={() => setPanel('overview')}
                >
                  Overview
                </PanelButton>

                <PanelButton
                  active={panel === 'results'}
                  onClick={() => setPanel('results')}
                >
                  Per-file results
                </PanelButton>

                <PanelButton
                  active={panel === 'dependencies'}
                  disabled={loadingRoadmap}
                  onClick={() =>
                    void loadRoadmapData(
                      result,
                      form.recipeId,
                      'dependencies'
                    )
                  }
                >
                  {loadingRoadmap
                    ? 'Building…'
                    : 'Blast radius'}
                </PanelButton>

                <PanelButton
                  active={panel === 'roadmap'}
                  disabled={loadingRoadmap}
                  onClick={() =>
                    void loadRoadmapData(
                      result,
                      form.recipeId,
                      'roadmap'
                    )
                  }
                >
                  {loadingRoadmap
                    ? 'Building…'
                    : 'Migration roadmap'}
                </PanelButton>
              </div>

              {depError && (
                <span className="font-mono text-[10px] text-danger">
                  {depError}
                </span>
              )}
            </div>

            {panel === 'overview' && (
              <RepoOverview
                results={items}
                failed={failed}
                roadmap={roadmap}
                onOpenResults={() =>
                  setPanel('results')
                }
                onOpenRoadmap={() =>
                  void loadRoadmapData(
                    result,
                    form.recipeId,
                    'roadmap'
                  )
                }
              />
            )}

            {panel === 'roadmap' && (
              <MigrationRoadmap
                roadmap={roadmap}
                selectedFile={selected}
                onSelectFile={setSelected}
              />
            )}

            {panel === 'dependencies' && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(deps).map((filename) => (
                    <button
                      key={filename}
                      type="button"
                      onClick={() =>
                        setSelected(filename)
                      }
                      className={`rounded border px-2 py-1 font-mono text-[10px] ${
                        selected === filename
                          ? 'border-signal text-signal'
                          : 'border-border text-muted hover:text-ink'
                      }`}
                    >
                      {filename}
                    </button>
                  ))}
                </div>

                {current ? (
                  <FileResultView
                    result={current}
                    dependsOn={
                      deps[current.filename ?? '']
                        ?.dependsOn
                    }
                    dependedOnBy={
                      deps[current.filename ?? '']
                        ?.dependedOnBy
                    }
                    onSelectFile={setSelected}
                  />
                ) : (
                  <p className="text-xs text-faint">
                    Pick a file to see its blast radius.
                  </p>
                )}
              </>
            )}
          </>
        )}

        {(result.mode !== 'repo' ||
          panel === 'results') && (
          <>
            {items.map((item) => (
              <FileResultView
                key={item.filename ?? 'snippet'}
                result={item}
              />
            ))}

            {failed.map((item, index) => (
              <div
                key={`${item.filename}-${index}`}
                className="rounded-md border border-danger/40 bg-danger/10 p-4 font-mono text-xs text-danger"
              >
                {item.filename}: {item.error}
              </div>
            ))}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function PanelButton({
  active,
  disabled = false,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2.5 py-1 font-sans text-xs disabled:opacity-50 ${
        active
          ? 'bg-surface-raised text-ink'
          : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}