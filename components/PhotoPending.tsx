// Warm, intentional stand-in for photography we don't have rights to fake —
// the property's own rooms, balcony and hosts, which are genuinely pending
// from the hosts. Never a flat grey box: it should read as "commissioned,
// not yet delivered", not as a broken image.
export function PhotoPending({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[linear-gradient(150deg,color-mix(in_srgb,var(--color-butter)_10%,var(--color-paper-raised)),color-mix(in_srgb,var(--color-ink)_13%,var(--color-paper)))] ${className ?? ""}`}
    >
      {/* Concentric kora rings, drawn faintly — the house mark, standing in
          for the photograph. */}
      <svg viewBox="0 0 120 120" className="h-20 w-20 text-ink/15" fill="none" aria-hidden>
        <circle cx="60" cy="60" r="34" stroke="currentColor" strokeWidth="1" />
        <circle cx="60" cy="60" r="22" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        <circle cx="60" cy="60" r="3.5" fill="currentColor" />
      </svg>
      {label && <span className="eyebrow absolute bottom-3 left-4 text-ink/30">{label}</span>}
    </div>
  );
}
