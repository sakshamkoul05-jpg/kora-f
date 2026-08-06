type DeckledEdgeProps = {
  /** Fill colour — should match the band being torn away, e.g. "var(--color-ink)". */
  fill: string;
  /** Flip vertically, for use at the bottom of a section instead of the top. */
  flip?: boolean;
  className?: string;
};

// A single irregular, hand-torn-paper edge. Fixed path (not random per
// render) so server and client markup match exactly.
const DECKLE_PATH =
  "M0,6 L40,9 L78,3 L121,10 L162,4 L205,11 L244,2 L288,8 L329,3 L371,10 L412,4 L453,9 L494,2 L536,8 L577,3 L619,10 L660,4 L701,9 L743,2 L784,8 L826,3 L867,10 L908,4 L950,9 L991,2 L1033,8 L1074,3 L1116,10 L1157,4 L1199,9 L1240,2 L1280,7 L1280,20 L0,20 Z";

export function DeckledEdge({ fill, flip, className }: DeckledEdgeProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1280 20"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute left-0 h-[14px] w-full ${flip ? "rotate-180" : ""} ${className ?? ""}`}
    >
      <path d={DECKLE_PATH} fill={fill} />
    </svg>
  );
}
