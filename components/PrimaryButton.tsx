"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useButterLamp } from "./motion/useButterLamp";

type Props = ComponentProps<typeof Link> & { className?: string };

/**
 * The site's one primary-CTA treatment: solid maroon with a butter lamp glow
 * on hover/focus. The glow is a static box-shadow on a child span whose
 * OPACITY is driven by noise — see useButterLamp. Reserve it for primary CTAs;
 * it is not a general hover effect.
 */
export function PrimaryButton({ className, children, ...props }: Props) {
  const { flameRef, handlers } = useButterLamp<HTMLSpanElement>();

  return (
    <Link
      {...props}
      {...handlers}
      className={`relative inline-block rounded-[var(--radius-kora)] bg-maroon px-8 py-3.5 text-center font-display text-[15px] tracking-wide text-paper transition-colors hover:bg-maroon-deep ${className ?? ""}`}
    >
      <span ref={flameRef} aria-hidden className="lamp-flame" />
      <span className="relative">{children}</span>
    </Link>
  );
}
