import type { Recipe } from '../types/migration';

// Small repo bounds. Backend allows 1-10 files (models.RefactorRepoRequest),
// but the Roadmap only means something when files can be ranked *against*
// each other, and the plan's demo repo is 4 files — so we float the floor
// at 2 and keep the ceiling low for a demo-safe, readable UI.
export const MIN_REPO_FILES = 2;
export const MAX_REPO_FILES = 5;

export const recipes: Recipe[] = [
  {
    id: 'python2to3',
    label: 'Python 2 \u2192 Python 3',
    from: 'Python 2',
    to: 'Python 3',
    accept: '.py',
    extensions: ['.py'],
    placeholder:
      '# Paste Python 2 code here.\n# e.g. print statements, xrange(), dict.iteritems(),\n# urllib2, except X, e: syntax\n',
  },
  {
    id: 'js_callback_to_async',
    label: 'Node.js callbacks \u2192 async/await',
    from: 'callbacks',
    to: 'async/await',
    accept: '.js,.mjs,.cjs',
    extensions: ['.js', '.mjs', '.cjs'],
    placeholder:
      '// Paste callback-style Node.js here.\n// e.g. function (err, data) { ... } chains\n',
  },
];

export const findRecipe = (id: string): Recipe => recipes.find((r) => r.id === id) ?? recipes[0];
