"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-mist/90 backdrop-blur-md">
      {/* The logo's own flag colours, as a binding thread along the top. */}
      <div className="flex h-[3px] w-full" aria-hidden>
        <span className="flex-1" style={{ background: "var(--flag-red)" }} />
        <span className="flex-1" style={{ background: "var(--color-deodar)" }} />
        <span className="flex-1" style={{ background: "var(--flag-yellow)" }} />
        <span className="flex-1" style={{ background: "var(--color-sky)" }} />
        <span className="flex-1" style={{ background: "var(--flag-white)" }} />
      </div>

      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} — home`}>
          <Image
            src="/brand/kora-house-mark.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[19px] tracking-[0.06em]">{site.name}</span>
            <span className="eyebrow mt-1 text-[9px] text-ink/40">McLeodganj</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`eyebrow relative transition-colors ${
                  active ? "text-ink" : "text-ink/55 hover:text-ink"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 h-px w-full bg-butter" aria-hidden />
                )}
              </Link>
            );
          })}
          <Link
            href="/rooms"
            className="rounded-[var(--radius-kora)] bg-maroon px-6 py-2.5 font-display text-sm tracking-wide text-paper transition-colors hover:bg-maroon-deep"
          >
            Book a room
          </Link>
        </nav>

        {/* 44px square, not the 36px it was — below that this is a miss on a
            phone. The bars stay 20px; only the touchable area grew, and the
            negative margin keeps it optically aligned with the edge. */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
        >
          <span
            className={`h-px w-5 bg-ink transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-5 bg-ink transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink/10 bg-mist px-5 pb-5 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="eyebrow block border-b border-ink/5 py-3.5 text-ink/60"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/rooms"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-[var(--radius-kora)] bg-maroon px-5 py-3.5 text-center font-display text-sm text-paper"
          >
            Book a room
          </Link>
        </nav>
      )}
    </header>
  );
}
