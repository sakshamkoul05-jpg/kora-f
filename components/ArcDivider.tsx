export function ArcDivider({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1280 48"
      preserveAspectRatio="none"
      className={`arc-divider ${className ?? ""}`}
    >
      <path
        d="M0,4 Q640,64 1280,4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
