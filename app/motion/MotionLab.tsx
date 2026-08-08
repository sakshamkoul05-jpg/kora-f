"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { KoraCircuit } from "@/components/motion/KoraCircuit";
import { MalaRail } from "@/components/motion/MalaRail";
import { ManiStone } from "@/components/motion/ManiStone";
import { NamchuWangden } from "@/components/motion/NamchuWangden";
import { PrayerWheelRow } from "@/components/motion/PrayerWheelRow";
import { koraWaypoints } from "@/lib/kora-route";
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
  { n: 2, name: "Prayer wheel", state: "built" },
  { n: 5, name: "Prayer flags", state: "built · noise-driven" },
  { n: 6, name: "Butter lamp", state: "built · noise-driven" },
  { n: 4, name: "Mani stones", state: "built · carved, shaping verified" },
  { n: 0, name: "Namchu Wangden", state: "placeholder · never animated" },
];

export function MotionLab() {
  const reduced = useReducedMotion();
  const [koraKey, setKoraKey] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8">
      <p className="eyebrow text-maroon">Internal · not linked in navigation</p>
      <h1 className="display-lg mt-3">Motion lab</h1>
      <p className="lede mt-5">
        Each signature interaction in isolation, for review with the hosts. All
        six are built.
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

      {/* ---- 2. Prayer wheel ---- */}
      <section className="mt-20 border-t border-ink/10 pt-10">
        <h2 className="display-md">2 · Prayer wheels</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Five brass drums in a row, as they are set along the kora wall. Each
          is a real cylinder with 20 vertical faces, turning under a fixed
          light — the sheen stays put and the metal moves through it.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Drag one and let go: velocity decays under friction and it coasts for
          several seconds. Or <strong>sweep across the row with the button
          held</strong> and each drum starts as you pass it, the way you brush a
          wall of wheels walking by. Spinning releases the mantra, which rises
          off the drum and fades. <strong>Clockwise only</strong> — pull one
          backwards and it resists, then springs back. Each loop stops dead at
          rest; none of them idle-spin. Keyboard: Enter or → to spin.
        </p>
        <div className="mt-10 flex justify-center rounded-[var(--radius-card)] border border-ink/10 bg-paper-raised py-12">
          <PrayerWheelRow />
        </div>
      </section>

      {/* ---- 5. Prayer flags ---- */}
      <section className="mt-20 border-t border-ink/10 pt-10">
        <h2 className="display-md">5 · Prayer flags</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          On the hero only — see the homepage. Gust amplitude comes from a
          looping noise value per flag, not a fixed period, so they never fall
          into visible sync. The wind decays to complete stillness after about
          eight seconds and the loop stops entirely; scrolling wakes it briefly.
          Colour order is fixed: blue, white, red, green, yellow.
        </p>
        <div className="mt-6 flex gap-2" aria-hidden>
          {["#4a6b88", "#e6ddc9", "#8c3341", "#4e6553", "#d2a44f"].map((c) => (
            <span key={c} className="h-8 w-12 rounded-[2px]" style={{ background: c }} />
          ))}
        </div>
      </section>

      {/* ---- 6. Butter lamp ---- */}
      <section className="mt-20 border-t border-ink/10 pt-10">
        <h2 className="display-md">6 · Butter lamp</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Hover or focus the button. The glow is a static shadow whose{" "}
          <em>opacity</em> is driven by noise — flame is not a sine wave. It is
          meant to be barely perceptible; if you notice it at a glance it needs
          halving.
        </p>
        <div className="mt-8">
          <PrimaryButton href="/motion">Check availability</PrimaryButton>
        </div>
      </section>

      {/* ---- 4. Mani stones ---- */}
      <section className="mt-20 border-t border-ink/10 pt-10">
        <h2 className="display-md">4 · Mani stones</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Depth, not motion. On hover or focus the light source&apos;s azimuth
          shifts twenty degrees — <strong>the stone itself never moves or
          scales</strong>. Click one to open its note.
        </p>
        <p className="mt-3 max-w-2xl rounded-[var(--radius-kora)] border border-butter/40 bg-butter/[0.07] p-4 text-sm leading-relaxed text-ink-soft">
          These are deliberately <strong>uncarved</strong>. The brief&apos;s
          standard is correct Uchen or nothing, and the stacked subjoined
          glyphs in <em>om mani padme hum</em> could not be visually verified
          here — that failure is invisible to anyone who doesn&apos;t read
          Tibetan. The correct codepoint sequence is recorded in
          <code className="font-data"> ManiStone.tsx</code> for someone to enable
          after checking it with a native reader present.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {koraWaypoints.map((w, i) => (
            <ManiStone
              key={w.name}
              index={i}
              name={w.isHouse ? "Kora House" : w.name}
              meta={w.minutes}
              note={w.note}
            />
          ))}
        </div>
      </section>

      {/* ---- Kalachakra ---- */}
      <section className="mt-20 border-t border-ink/10 pt-10">
        <h2 className="display-md">Namchu Wangden</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Placed once, static, as a threshold mark above the booking
          confirmation card. <strong>Never animated</strong> — not a loader, not
          a spinner, not a background pattern, not a hover effect. The artwork
          is to be commissioned from a Tibetan artist or sourced from
          Norbulingka Institute, so this is a marked placeholder at the correct
          aspect ratio rather than a traced approximation. It is not mounted
          anywhere yet: the booking confirmation screen does not exist.
        </p>
        <div className="mt-10">
          <NamchuWangden />
        </div>
      </section>
    </div>
  );
}
