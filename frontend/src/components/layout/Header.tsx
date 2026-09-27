interface HeaderProps {
  /** Small label shown after the wordmark, e.g. "Repository results". */
  subtitle?: string;
  /** Optional right-aligned action, e.g. a "Back to input" button. */
  action?: React.ReactNode;
}

/**
 * Shared top bar for the whole app. Keeps a single source of truth for the
 * brand mark + tagline so every screen (input, results, roadmap...) looks
 * consistent instead of each screen inventing its own <h1>.
 */
export function Header({ subtitle, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/80 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal/15 ring-1 ring-signal/30">
            <span className="font-mono text-sm font-bold text-signal">LM</span>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="font-sans text-base font-semibold tracking-tight text-ink">
              Legacy Migrate
            </span>
            <span className="font-sans text-xs text-muted">
              {subtitle ?? 'AI-assisted migration, with proof you can check'}
            </span>
          </div>
        </div>

        {action}
      </div>
    </header>
  );
}
