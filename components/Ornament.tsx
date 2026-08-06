// Ornament drawn from Tibetan decorative vocabulary — cloud scroll (sprin),
// lotus petal band, and interlace. These are the *decorative* motifs from
// textile borders, thangka framing and painted woodwork, deliberately not the
// sacred symbols (the Eight Auspicious Symbols, the dharmachakra): a badly
// drawn sacred symbol is worse than no symbol at all, and these carry the
// same visual identity without that risk.
//
// Always fine gold line-work, never filled, never busy.

type Variant = "cloud" | "lotus" | "knot";

function CloudScroll() {
  // Curling cloud band — the scalloped, spiralling form used along the top
  // edge of painted panels.
  return (
    <svg viewBox="0 0 72 24" className="h-5 w-[72px] text-butter" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M4 18c0-5 6-7 9-3 1-5 8-6 10-1 3-4 9-2 9 3" />
        <path d="M32 17c1-6 8-8 11-3 2-5 9-5 11 0 2-3 7-2 8 3" />
        <path d="M9 18c-1-2 1-4 3-3" />
        <path d="M40 17c-1-2 1-4 3-3" />
        <path d="M2 21h68" opacity="0.45" />
      </g>
    </svg>
  );
}

function LotusBand() {
  // Repeating pointed petals, as used on plinth and border bands.
  return (
    <svg viewBox="0 0 72 24" className="h-5 w-[72px] text-butter" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M6 19Q15 3 24 19" />
        <path d="M24 19Q33 3 42 19" />
        <path d="M42 19Q51 3 60 19" />
        <path d="M15 19q0-6 0-8" opacity="0.5" />
        <path d="M33 19q0-6 0-8" opacity="0.5" />
        <path d="M51 19q0-6 0-8" opacity="0.5" />
        <path d="M4 20h64" opacity="0.45" />
      </g>
    </svg>
  );
}

function Interlace() {
  // Woven chain — the over/under lattice from carpet and appliqué borders.
  return (
    <svg viewBox="0 0 72 24" className="h-5 w-[72px] text-butter" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.1">
        <rect x="14" y="6" width="16" height="12" rx="6" />
        <rect x="28" y="6" width="16" height="12" rx="6" />
        <rect x="42" y="6" width="16" height="12" rx="6" />
        <path d="M4 12h10M58 12h10" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

const VARIANTS: Record<Variant, () => React.ReactElement> = {
  cloud: CloudScroll,
  lotus: LotusBand,
  knot: Interlace,
};

export function Ornament({ variant = "cloud" }: { variant?: Variant }) {
  const Mark = VARIANTS[variant];
  return <Mark />;
}

/** Ornament centred between two hairlines, for major section boundaries. */
export function OrnamentDivider({
  variant = "cloud",
  className,
  lineTone = "text-ink/15",
}: {
  variant?: Variant;
  className?: string;
  /** Tailwind text-colour for the flanking rules, e.g. "text-mist/15" on dark. */
  lineTone?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-sm items-center gap-4 ${className ?? ""}`}
      aria-hidden
    >
      <svg viewBox="0 0 100 2" preserveAspectRatio="none" className={`h-px flex-1 ${lineTone}`}>
        <line x1="0" y1="1" x2="100" y2="1" stroke="currentColor" strokeWidth="2" />
      </svg>
      <Ornament variant={variant} />
      <svg viewBox="0 0 100 2" preserveAspectRatio="none" className={`h-px flex-1 ${lineTone}`}>
        <line x1="0" y1="1" x2="100" y2="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}

/** Eyebrow + ornament, for the top of a section. */
export function SectionMark({
  eyebrow,
  variant = "cloud",
  tone = "text-maroon",
}: {
  eyebrow: string;
  variant?: Variant;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Ornament variant={variant} />
      <p className={`eyebrow ${tone}`}>{eyebrow}</p>
    </div>
  );
}
