// Warm, intentional-looking stand-in for photography we don't have rights
// to fake — property/room photos that are genuinely pending from the hosts.
// Never a flat grey box: it should read as "coming soon", not "broken".
export function PhotoPending({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-ink)_7%,var(--color-paper)),color-mix(in_srgb,var(--color-ink)_14%,var(--color-paper)))] ${className ?? ""}`}
    >
      <svg viewBox="0 0 64 64" className="h-10 w-10 text-ink/20">
        <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="32" cy="32" r="3" fill="currentColor" />
      </svg>
      {label && (
        <span className="eyebrow absolute bottom-3 left-3 text-ink/35">{label}</span>
      )}
    </div>
  );
}
