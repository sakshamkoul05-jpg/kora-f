"use client";

import { useEffect, useState } from "react";

export type MalaSection = { id: string; label: string };

// Vertical string of beads tracking scroll position through a page's
// sections. Every fourth bead is larger, mirroring the proportion of a
// traditional 108-bead mala's counter beads at 27/54/81.
export function MalaIndicator({ sections }: { sections: MalaSection[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sections.findIndex((s) => s.id === entry.target.id);
            if (idx !== -1) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  if (sections.length < 2) return null;

  return (
    <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:right-8 xl:flex">
      {sections.map((s, i) => {
        const big = (i + 1) % 4 === 0;
        const isActive = i === active;
        return (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to ${s.label}`}
            aria-current={isActive}
            onClick={() => goTo(s.id)}
            className="group flex items-center justify-center p-1.5"
          >
            <span
              className={[
                "block rounded-full transition-colors duration-300",
                big ? "h-3 w-3" : "h-1.5 w-1.5",
                isActive ? "mala-settle bg-maroon" : "bg-ink/25 group-hover:bg-ink/45",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
