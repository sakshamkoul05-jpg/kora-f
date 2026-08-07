"use client";

import { useState } from "react";
import { KoraCircuit } from "@/components/motion/KoraCircuit";
import { ManiStone } from "@/components/motion/ManiStone";
import { PrayerWheel } from "@/components/motion/PrayerWheel";
import { koraNotes, koraWaypoints } from "@/lib/kora-route";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The prayer wheel is the entry point to the route — spinning it reveals the
 * circuit. The content is always present in the DOM and always reachable: the
 * reveal is opacity and transform only, there is a plain text control for
 * anyone who will not or cannot drag, and under reduced motion it is simply
 * open from the start. Gating content behind a gesture with no way past it
 * would be a trap, not an interaction.
 */
export function KoraSection() {
  const reduced = useReducedMotion();
  const [spun, setSpun] = useState(false);
  const revealed = spun || reduced;

  return (
    <div>
      <div className="flex flex-col items-center">
        <PrayerWheel onSpin={() => setSpun(true)} />
        {!revealed && (
          <button
            type="button"
            onClick={() => setSpun(true)}
            className="mt-3 border-b border-ink/25 pb-0.5 text-sm text-ink-soft transition-colors hover:border-ink/60"
          >
            Or show the route
          </button>
        )}
      </div>

      <div
        className={`mt-14 transition-[opacity,transform] duration-700 ease-out ${
          revealed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <KoraCircuit />

        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-3 gap-y-2">
          {koraNotes.map((note) => (
            <span
              key={note}
              className="rounded-[var(--radius-kora)] border border-ink/12 px-3 py-1 font-data text-[11px] text-ink-soft"
            >
              {note}
            </span>
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-md text-center text-xs text-ink/40">
          A stylised diagram of the circuit, not drawn to scale. Walking times
          are approximate.
        </p>

        <div className="mt-16">
          <p className="eyebrow text-center text-ink/45">Waypoints</p>
          <div className="mt-8 grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
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
          <p className="mt-6 text-center text-xs text-ink/35">
            Stones are left uncarved — see MOTION.md.
          </p>
        </div>
      </div>
    </div>
  );
}
