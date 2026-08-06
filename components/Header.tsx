"use client";

import Link from "next/link";
import { useState } from "react";
import { nav, site } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="hairline-b sticky top-0 z-50 bg-mist/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="font-display text-lg tracking-wide">
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="eyebrow text-ink/70 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/rooms"
            className="rounded-[var(--radius-kora)] bg-maroon px-5 py-2 font-display text-sm text-mist transition-opacity hover:opacity-90"
          >
            Book
          </Link>
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
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
        <nav className="hairline-t flex flex-col gap-1 px-5 pb-5 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="eyebrow py-3 text-ink/70"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/rooms"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-[var(--radius-kora)] bg-maroon px-5 py-3 text-center font-display text-sm text-mist"
          >
            Book
          </Link>
        </nav>
      )}
    </header>
  );
}
