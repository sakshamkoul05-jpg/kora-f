// A hairline arc on either side of a small cloud-scroll flourish — the
// motif common to Tibetan textile and temple-woodwork borders. Used at
// major section boundaries as a visible (not just animated) cultural
// element, always in a single gold hairline, never as a busy pattern.
export function TibetanDivider({
  className,
  lineTone = "text-ink/15",
}: {
  className?: string;
  /** Tailwind text-color utility for the flanking hairlines, e.g. "text-mist/15" on a dark background. */
  lineTone?: string;
}) {
  return (
    <div className={`mx-auto flex w-full max-w-xs items-center gap-3 ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" className={`h-px flex-1 ${lineTone}`}>
        <line x1="0" y1="2" x2="100" y2="2" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg viewBox="0 0 44 20" className="h-4 w-9 shrink-0 text-butter">
        <path
          d="M4 14c3-6 8-9 13-6-2-4 2-8 7-6-3-3 0-7 5-6 4 1 5 5 3 8 4-1 8 2 8 6-4 3-9 3-13 0 2 4-2 7-6 6-4-1-6-5-4-8-4 2-9 1-13-4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" className={`h-px flex-1 ${lineTone}`}>
        <line x1="0" y1="2" x2="100" y2="2" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
