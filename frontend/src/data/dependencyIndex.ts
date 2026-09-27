import type { RoadmapEntry } from '../types/migration';

/**
 * The per-file dependency data, keyed by filename.
 *
 * Source of truth is Layer 6a, and the only way to get it from the backend
 * is /migration-roadmap — the same call that produces the ranking. So the
 * dependency panel reads the same response the roadmap screen will, rather
 * than a second, possibly divergent source.
 *
 * That matters: if this panel and the roadmap screen each derived
 * dependencies their own way, they could disagree on screen, and the whole
 * claim of the product is that these numbers are parsed rather than guessed.
 */
export type DependencyIndex = Record<
  string,
  { dependsOn: string[]; dependedOnBy: string[] }
>;

export function indexDependencies(roadmap: RoadmapEntry[]): DependencyIndex {
  const index: DependencyIndex = {};
  for (const entry of roadmap) {
    index[entry.file] = {
      dependsOn: entry.depends_on,
      dependedOnBy: entry.depended_on_by,
    };
  }
  return index;
}
