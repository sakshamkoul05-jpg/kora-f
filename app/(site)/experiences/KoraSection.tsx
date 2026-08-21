"use client";

import Image from "next/image";
import { useState } from "react";
import { PhotoCredit } from "@/components/PhotoCredit";
import { KoraCircuit } from "@/components/motion/KoraCircuit";
import { ManiStone } from "@/components/motion/ManiStone";
import { PrayerWheelRow } from "@/components/motion/PrayerWheelRow";
import { koraPhotos } from "@/lib/image-credits";
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
        <PrayerWheelRow onSpin={() => setSpun(true)} />
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
        {/*
          The circle is hidden on phones, deliberately.

          Its viewBox is 820 units wide; at 375px that scales labels down to
          roughly 4px on screen — unreadable, not merely small, and no font
          bump fixes a diagram that needs eight labels around a ring in less
          than 400px. The same five stops appear as cards immediately below in
          walking order, which is the better presentation at this width
          anyway. Showing both would be duplication; showing the circle alone
          would be showing nothing.
        */}
        <div className="hidden sm:block">
          <KoraCircuit />
        </div>

        <p className="mx-auto max-w-md text-center text-sm text-ink-soft sm:hidden">
          The circuit runs clockwise from the temple gate and comes back to it.
          The five stops are below, in the order you walk them.
        </p>

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

        {/* Hidden with the diagram it describes — on phones there is nothing
            for "not drawn to scale" to refer to. */}
        <p className="mx-auto mt-5 hidden max-w-md text-center text-xs text-ink/40 sm:block">
          A stylised diagram of the circuit, not drawn to scale. Walking times
          are approximate.
        </p>

        <div className="mt-16">
          <p className="eyebrow text-center text-ink/45">Along the way</p>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink-soft">
            Five stops, in the order you walk them.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {koraWaypoints.map((w, i) => {
              const photo = w.photo ? koraPhotos[w.photo] : null;
              return (
                <div key={w.name} className="flex flex-col">
                  {photo && (
                    <figure className="group relative mb-4 aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
                      <Image
                        src={photo.file}
                        alt={photo.alt}
                        fill
                        className="photo-warm object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw"
                      />
                      <PhotoCredit image={photo} />
                    </figure>
                  )}
                  <ManiStone
                    index={i}
                    name={w.isHouse ? "Kora House" : w.name}
                    meta={w.minutes}
                    note={w.note}
                  />
                  {w.photoCaption && (
                    <p className="mt-2 text-xs leading-relaxed text-ink/40">{w.photoCaption}</p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-ink/35">
            These photographs were taken on this kora, but they show the path
            rather than each named landmark. The hosts&apos; own pictures of
            their stretch will replace them.
          </p>
        </div>
      </div>
    </div>
  );
}
