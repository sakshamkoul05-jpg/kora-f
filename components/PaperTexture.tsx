// Hand-made-paper texture, applied once at the layout level. Two layers,
// because real Lokta paper has both: a fine fibre grain and a much broader,
// softer unevenness from how the pulp dried. One layer alone reads as
// "digital noise filter"; together they read as stock.
//
// Decorative only — kept out of hit-testing and the accessibility tree.
export function PaperTexture() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {/* Fine fibre */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.09] mix-blend-multiply">
        <filter id="kora-fibre">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#kora-fibre)" />
      </svg>

      {/* Broad mottle — the uneven dry-down across the sheet */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply">
        <filter id="kora-mottle">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#kora-mottle)" />
      </svg>

      {/* Soft vignette — light falls off toward the edges of a real sheet */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 90% at 50% 45%, transparent 55%, color-mix(in srgb, var(--color-ink) 11%, transparent) 100%)",
        }}
      />
    </div>
  );
}
