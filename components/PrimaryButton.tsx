import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & { className?: string };

// The site's one primary-CTA treatment: solid maroon, butter-lamp glow on
// hover/focus. Reserve `.lamp-hover` for these — it is not a general hover effect.
export function PrimaryButton({ className, ...props }: Props) {
  return (
    <Link
      {...props}
      className={`lamp-hover inline-block rounded-[var(--radius-kora)] bg-maroon px-8 py-3.5 text-center font-display text-[15px] tracking-wide text-paper transition-colors hover:bg-maroon-deep ${className ?? ""}`}
    />
  );
}
