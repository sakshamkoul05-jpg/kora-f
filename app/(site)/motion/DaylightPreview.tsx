"use client";

import { useEffect, useState } from "react";
import { phaseForInstant, phaseLabel, type Phase } from "@/lib/daylight";

const PHASES: { key: Phase; hours: string; note: string }[] = [
  { key: "dawn", hours: "05:00 – 08:00", note: "Cool and thin, the valley still in shadow" },
  { key: "day", hours: "08:00 – 17:00", note: "The site's own parchment, unaltered" },
  { key: "dusk", hours: "17:00 – 20:00", note: "Sun behind the ridge, amber and maroon" },
  { key: "night", hours: "20:00 – 05:00", note: "Deepened and cooled, still readable" },
];

/**
 * Somewhere to actually look at the daylight shift.
 *
 * Without this you have to sit at the site for sixteen hours to see all four
 * phases, and each transition takes four seconds on purpose — the effect is
 * built so that nobody catches it changing, which makes it almost impossible
 * to review. Pinning a phase is the only practical way to judge it.
 */
export function DaylightPreview() {
  const [real, setReal] = useState<Phase | null>(null);
  const [pinned, setPinned] = useState<Phase | null>(null);
  const [istTime, setIstTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setReal(phaseForInstant(now));
      const ist = new Date(now.getTime() + (5 * 60 + 30) * 60_000);
      setIstTime(
        `${String(ist.getUTCHours()).padStart(2, "0")}:${String(ist.getUTCMinutes()).padStart(2, "0")}`
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // The DOM is driven from state rather than from the click handlers: the
  // React Compiler rejects mutating anything outside the component during
  // render or in an event body, and an effect is the honest place for it.
  useEffect(() => {
    const root = document.documentElement;
    if (pinned) {
      root.dataset.daylightLock = "1";
      root.dataset.daylight = pinned;
    } else {
      delete root.dataset.daylightLock;
      if (real) root.dataset.daylight = real;
    }
  }, [pinned, real]);

  // Leaving this page must release the pin, or the whole site stays stuck in
  // whatever phase was last previewed.
  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.daylightLock;
    };
  }, []);

  return (
    <section className="mt-24 border-t border-ink/10 pt-12">
      <h2 className="display-md">7 · Daylight</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">
        The page is lit by the real hour in McLeodganj. Each change takes four
        seconds and is meant to go unnoticed, so pin a phase below to judge it —
        the whole page shifts, not just this panel.
      </p>

      <div className="mt-6 rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-5">
        <p className="eyebrow text-ink/45">Right now in McLeodganj</p>
        <p className="mt-2 font-data text-lg">
          {istTime || "—"} IST{" "}
          <span className="text-ink/45">
            · {real ? phaseLabel(real) : "reading the clock…"}
          </span>
        </p>
        {pinned && (
          <p className="mt-3 rounded-[var(--radius-kora)] bg-butter/20 px-3 py-2 text-sm text-ink-soft">
            Pinned to <strong className="text-ink">{pinned}</strong> — this is a
            preview, not what a guest sees.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PHASES.map((p) => {
          const isReal = real === p.key;
          const isPinned = pinned === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPinned(p.key)}
              aria-pressed={isPinned}
              className={`rounded-[var(--radius-card)] border p-4 text-left transition-colors ${
                isPinned
                  ? "border-deodar-deep bg-deodar/[0.08]"
                  : "border-ink/12 bg-paper hover:border-ink/30"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-lg capitalize">{p.key}</span>
                <span className="font-data text-[11px] text-ink/45">{p.hours}</span>
              </div>
              <p className="mt-1.5 text-sm text-ink-soft">{p.note}</p>
              {isReal && (
                <p className="mt-2 font-data text-[11px] uppercase tracking-wide text-deodar-deep">
                  happening now
                </p>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setPinned(null)}
        disabled={!pinned}
        className="mt-5 rounded-[var(--radius-kora)] border border-ink/25 px-5 py-2.5 text-sm text-ink-soft disabled:opacity-40"
      >
        Back to real time
      </button>

      <p className="mt-6 text-sm text-ink/45">
        Contrast was measured in all four phases before shipping: body ink stays
        between 13.8:1 and 15.6:1, well past the 4.5:1 the standard asks for. The
        palette moves in hue, not lightness, for exactly that reason.
      </p>
    </section>
  );
}
