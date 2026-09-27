import { cn } from '../../utils/cn';
import type { Recipe, RecipeId } from '../../types/migration';

interface RecipePickerProps {
  recipes: Recipe[];
  value: RecipeId;
  onChange: (id: RecipeId) => void;
}

export function RecipePicker({ recipes, value, onChange }: RecipePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-sans text-xs text-faint">Recipe</span>
      <div className="flex flex-col gap-2 sm:flex-row">
        {recipes.map((r) => {
          const active = r.id === value;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors',
                active
                  ? 'border-signal/70 bg-signal/10 text-signal'
                  : 'border-border text-muted hover:border-faint hover:text-ink'
              )}
            >
              <span className="text-ink">{r.from}</span>
              <span className={cn('mx-1.5', active ? 'text-signal' : 'text-faint')}>&rarr;</span>
              <span className={active ? 'text-ink' : 'text-ink'}>{r.to}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
