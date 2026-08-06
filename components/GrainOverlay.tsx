// Fine grain/noise overlay, applied once at the layout level. Purely
// decorative and non-interactive — kept out of the tab order and hit-testing.
export function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.035] mix-blend-multiply"
    >
      <svg className="h-full w-full">
        <filter id="kora-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#kora-grain)" />
      </svg>
    </div>
  );
}
