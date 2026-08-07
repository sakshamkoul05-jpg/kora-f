/**
 * Namchu Wangden — the Kalachakra tenfold-powerful monogram.
 *
 * ── READ BEFORE TOUCHING ───────────────────────────────────────────────────
 * This is NEVER animated. Not a loader, not a spinner, not a background
 * pattern, not a hover effect. It is placed once, static, as a threshold mark
 * above the booking confirmation card — the way it appears above a doorway.
 *
 * The artwork is to be COMMISSIONED from a Tibetan artist or sourced from
 * Norbulingka Institute. It must not be generated, traced, or approximated in
 * code, so this ships as a marked placeholder at the correct aspect ratio
 * rather than a drawing of the symbol.
 *
 * NOT YET MOUNTED: the booking confirmation screen does not exist — the
 * booking flow is step 6 of kora-house-build-spec.md and has not been started.
 * Mount this above the confirmation card when that screen is built.
 */
export function NamchuWangden({ className }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex w-[132px] flex-col items-center ${className ?? ""}`}
      role="img"
      aria-label="Namchu Wangden, the tenfold powerful monogram — artwork pending"
    >
      {/* TODO_ARTWORK: replace with commissioned artwork. Aspect ratio 132:180
          (taller than wide — the monogram stacks vertically). Do not animate. */}
      <div
        className="flex w-full items-center justify-center rounded-[var(--radius-kora)] border border-dashed border-butter/45 bg-butter/[0.06]"
        style={{ aspectRatio: "132 / 180" }}
      >
        <span className="px-3 text-center font-data text-[10px] leading-relaxed tracking-[0.14em] text-ink/40">
          TODO_ARTWORK
          <br />
          NAMCHU WANGDEN
          <br />
          132×180
        </span>
      </div>
    </div>
  );
}
