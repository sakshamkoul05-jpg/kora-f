"use client";

import { useState } from "react";
import { KoraCircuit } from "@/components/motion/KoraCircuit";
import { MalaRail } from "@/components/motion/MalaRail";
import { useReducedMotion } from "@/lib/useReducedMotion";

const demoSections = [
  { id: "m-1", label: "First" },
  { id: "m-2", label: "Second" },
  { id: "m-3", label: "Third" },
  { id: "m-4", label: "Fourth" },
  { id: "m-5", label: "Fifth" },
  { id: "m-6", label: "Sixth" },
];

const status = [
  { n: 1, name: "Mala rail", state: "built" },
  { n: 3, name: "Kora circuit", state: "built" },
  { n: 2, name: "Prayer wheel", state: "pending" },
  { n: 5, name: "Prayer flags", state: "in place, pending rework to brief" },
  { n: 6, name: "Butter lamp", state: "in place, pending rework to brief" },
  { n: 4, name: "Mani stones", state: "pending" },
];

export function MotionLab() {
  const reduced = useReducedMotion();
  const [koraKey, setKoraKey] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8">
      <p className="eyebrow text-maroon">Internal · not linked in navigation</p>
      <h1 className="display-lg mt-3">Motion lab</h1>
      <p className="lede mt-5">
        Each signature interaction in isolation, for review with the hosts.
        Build order per the brief is 1, 3, 2, 5, 6, 4 — interactions 1 and 3
        are complete and everything below the divider is not yet reworked.
      </p>

      <div
        className={`mt-8 rounded-[var(--radius-card)] border p-5 ${
          reduced ? "border-deodar/40 bg-deodar/[0.07]" : "border-ink/12 bg-paper-raised"
        }`}
      >
        <p className="eyebrow text-ink/45">Detected motion preference</p>
        <p className="mt-2 font-data text-sm">
          prefers-reduced-motion:{" "}
          <strong>{reduced ? "reduce — all motion disabled" : "no-preference — motion active"}</strong>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          This reads the live OS setting. To test the reduced path: DevTools →
          Rendering → &ldquo;Emulate CSS prefers-reduced-motion&rdquo;. Under
          reduce, the mala still marks position and the circuit renders fully
          drawn — both stay functional, neither moves.
        </p>
      </div>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {status.map((s) => (
          <li
            key={s.n}
            className="flex items-baseline gap-3 rounded-[var(--radius-kora)] border border-ink/10 px-4 py-2.5 text-sm"
          >
            <span className="font-data text-ink/40">{s.n}</span>
            <span className="font-display">{s.name}</span>
            <span className="ml-auto font-data text-[11px] text-ink-soft">{s.state}</span>
          </li>
        ))}
      </ul>

      {/* ---- 1. Mala rail ---- */}
      <section className="mt-20 border-t border-ink/10 pt-10">
        <h2 className="display-md">1 · Mala rail</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          The rail is fixed to the right margin and appears at <code className="font-data">xl</code> and
          above — scroll the blocks below and watch it advance. Reach the last
          block to see the guru bead take the turn: the rail pauses, the guru
          bead acknowledges, and travel reverses. It never wraps back to the
          top, because a mala is never counted past the guru bead.
        </p>
        <p className="mt-2 font-data text-xs text-ink/40">
          Hover or tab to a bead for its label. Every bead is a real button.
        </p>

        <MalaRail sections={demoSections} />

        <div className="mt-8 space-y-4">
          {demoSections.map((s, i) => (
            <div
              key={s.id}
              id={s.id}
              className="flex h-[62vh] flex-col justify-center rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised px-8"
            >
              <p className="eyebrow text-ink/40">Block {i + 1} of {demoSections.length}</p>
              <p className="display-md mt-2">{s.label}</p>
              {i === demoSections.length - 1 && (
                <p className="mt-3 max-w-md text-sm text-ink-soft">
                  This is the guru bead. Scrolling back up from here runs the
                  return pass — the settle animation travels the other way.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- 3. Kora circuit ---- */}
      <section className="mt-20 border-t border-ink/10 pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display-md">3 · Kora circuit</h2>
          <button
            type="button"
            onClick={() => setKoraKey((k) => k + 1)}
            className="rounded-[var(--radius-kora)] border border-ink/20 px-4 py-2 font-data text-xs text-ink-soft transition-colors hover:border-ink/40"
          >
            Replay draw
          </button>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Drawn with <code className="font-data">stroke-dasharray</code> progression as the section scrolls
          through the viewport. Where the browser supports{" "}
          <code className="font-data">animation-timeline: view()</code> the draw is scrubbed by scroll
          position off the main thread; otherwise an IntersectionObserver plays
          it once on entry. The house marker is the climax and sits centred at
          the foot of the loop.
        </p>

        <div className="mt-10">
          <KoraCircuit key={koraKey} />
        </div>
      </section>

      <p className="mt-20 border-t border-ink/10 pt-8 text-sm text-ink-soft">
        Interactions 2, 5, 6 and 4 follow after review, per the brief&apos;s
        instruction to stop after 1 and 3.
      </p>
    </div>
  );
}
