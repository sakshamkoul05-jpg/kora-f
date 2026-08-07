"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { jitterRange, round3 } from "@/lib/deterministic";
import {
  completeTurn,
  initialRailState,
  railTransition,
  type RailState,
} from "@/lib/mala-state";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type MalaSection = { id: string; label: string };

/**
 * The mala rail — primary scroll navigation.
 *
 * Derived from the 108-bead mala. Three properties of the object are load
 * bearing and must not be "improved":
 *
 *   1. THE GURU BEAD IS NEVER CROSSED. On a real mala you count to the guru
 *      bead and then reverse the strand — you do not pass over it and you do
 *      not wrap around to the start. So this rail never takes an index modulo
 *      the section count. On reaching the last section it pauses, flips
 *      `pass` to "return", and subsequent travel runs back the other way.
 *      A wrap-around here would be the single thing the object doesn't do.
 *   2. Counter beads sit at the quarter positions (27/54/81 of 108), not at
 *      "every fourth bead" — that was an error in the original build spec.
 *   3. Beads are bodhi seed or sandalwood: matte, and never identical. Each
 *      radius carries a small deterministic wobble seeded from its index.
 *
 * Position is tracked with IntersectionObserver, never a scroll listener.
 */
export function MalaRail({ sections }: { sections: MalaSection[] }) {
  const [rail, setRail] = useState<RailState>(initialRailState);
  const reduced = useReducedMotion();

  // Mirror of the render state, so the observer callback can read the current
  // value without having to re-subscribe on every change.
  const railRef = useRef<RailState>(initialRailState);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { active, pass, turning } = rail;
  const lastIndex = sections.length - 1;

  const apply = useCallback((next: RailState) => {
    railRef.current = next;
    setRail(next);
  }, []);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = sections.findIndex((s) => s.id === entry.target.id);
          if (idx === -1) continue;

          // All traversal rules live in lib/mala-state.ts, which is unit
          // tested — including the guarantee that the strand never wraps past
          // the guru bead. Keep the rules there, not here.
          const { state, scheduleTurn } = railTransition(railRef.current, idx, lastIndex);
          if (state === railRef.current) continue;
          apply(state);

          if (scheduleTurn) {
            if (turnTimer.current) clearTimeout(turnTimer.current);
            turnTimer.current = setTimeout(() => {
              apply(completeTurn(railRef.current));
            }, 600);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      if (turnTimer.current) clearTimeout(turnTimer.current);
    };
  }, [sections, lastIndex, apply]);

  const goTo = useCallback(
    (id: string | null) => {
      if (id === null) {
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        return;
      }
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    },
    [reduced]
  );

  if (sections.length < 2) return null;

  // Counter beads at the quarter positions, as on a real mala.
  const quarters = new Set(
    [0.25, 0.5, 0.75].map((q) => Math.max(1, Math.round(sections.length * q)) - 1)
  );

  const settleClass = reduced ? "" : pass === "outward" ? "mala-settle-down" : "mala-settle-up";

  return (
    <nav
      aria-label="Page sections"
      className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
    >
      <div className="pointer-events-auto relative flex flex-col items-center gap-[18px] py-2">
        {/* The cord */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink/20"
        />

        {/* Guru bead — the origin. Not one of the counted beads; it returns
            you to the top and marks where the strand turns. */}
        <button
          type="button"
          onClick={() => goTo(null)}
          className={`group relative z-10 flex items-center justify-center rounded-full p-1 ${
            turning && !reduced ? "mala-turn" : ""
          }`}
        >
          <span className="mala-label">Back to top</span>
          <span
            aria-hidden
            className="block rounded-full bg-maroon-deep ring-1 ring-butter/40"
            style={{ width: 15, height: 15 }}
          />
        </button>

        {sections.map((s, i) => {
          const isActive = i === active;
          const isQuarter = quarters.has(i);
          const base = isQuarter ? 10 : 6.5;
          // Matte seeds, never identical circles.
          const size = round3(base + jitterRange(i, 7, -0.9, 1.4));

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              aria-current={isActive ? "location" : undefined}
              className="group relative z-10 flex items-center justify-center p-1.5"
            >
              <span className="mala-label">{s.label}</span>
              <span
                aria-hidden
                className={`block rounded-full transition-colors duration-300 ${
                  isActive
                    ? `bg-maroon ${settleClass}`
                    : "bg-ink/30 group-hover:bg-ink/50 group-focus-visible:bg-ink/50"
                }`}
                style={{ width: size, height: size }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
