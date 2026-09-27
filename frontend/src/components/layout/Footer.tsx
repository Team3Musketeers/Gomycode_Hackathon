/**
 * Shared footer. Static content only — no data dependency — so it can be
 * dropped onto any screen without prop drilling.
 */
export function Footer() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans">
          Built by <span className="text-muted">3Musketeers</span> for the GOMYCODE × NVIDIA
          Hackathon.
        </p>

        <div className="flex items-center gap-4 font-sans">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-safe" />
            Dependency graph: parsed, not predicted
          </span>
          <a
            href="https://hackathon.gomycode.com/#prizes"
            target="_blank"
            rel="noreferrer"
            className="text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Prize criteria
          </a>
        </div>
      </div>
    </footer>
  );
}
