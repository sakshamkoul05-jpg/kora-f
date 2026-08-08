"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OM_MANI_PADME_HUM, ensureTibetan } from "@/lib/mantra";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { REST_OMEGA, clampSpin, decayOmega } from "@/lib/wheel-physics";

const WHEELS = 5;
const HOVER_OMEGA = 300; // deg/s the drum settles to while hovered
const SPIN_UP = 5.5; // how quickly it reaches that, per second

/**
 * A wall of mani wheels — five copper drums in a row, as they are set along
 * the kora wall below the house.
 *
 * ── Why this is a scrolling skin and not a faceted cylinder ────────────────
 * The first version built each drum from 20 flat faces in `preserve-3d`. That
 * cannot carry continuous ornament: the Greek key rings, the scrollwork and
 * the mantra all break at every face seam, and no face is wide enough to hold
 * a legible character. Real wheels are chased with unbroken bands.
 *
 * So the drum is a clipped window onto a skin that carries the full register
 * stack twice over, translated horizontally. One rotation = one tile width, so
 * it loops seamlessly. Rotation is still `transform` only, so it stays on the
 * compositor, and the ornament is continuous.
 *
 * The cylinder comes from a FIXED shading overlay — dark at both edges, a
 * specular band off-centre. The light stays in the room and the metal turns
 * through it. That, more than the colour, is what makes it read as metal.
 *
 * CLOCKWISE ONLY, enforced in lib/wheel-physics.ts and unit tested.
 */
export function PrayerWheelRow({ onSpin }: { onSpin?: () => void }) {
  const reduced = useReducedMotion();
  const [carved, setCarved] = useState(false);
  const announced = useRef(false);

  useEffect(() => {
    let cancelled = false;
    ensureTibetan().then((ok) => {
      if (!cancelled && ok) setCarved(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSpin = useCallback(() => {
    if (announced.current) return;
    announced.current = true;
    onSpin?.();
  }, [onSpin]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="flex items-end justify-center gap-2 sm:gap-4"
        role="group"
        aria-label="A row of five prayer wheels. Hover or focus one to turn it."
      >
        {Array.from({ length: WHEELS }, (_, i) => (
          <Wheel key={i} index={i} carved={carved} reduced={reduced} onSpin={handleSpin} />
        ))}
      </div>
      <p className="font-data text-[11px] tracking-[0.14em] text-ink/40">
        {reduced ? "TURNING DISABLED — REDUCED MOTION" : "HOVER TO TURN · CLOCKWISE"}
      </p>
    </div>
  );
}

type Emission = { key: number; drift: number };

function Wheel({
  index,
  carved,
  reduced,
  onSpin,
}: {
  index: number;
  carved: boolean;
  reduced: boolean;
  onSpin: () => void;
}) {
  const skinRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const omega = useRef(0);
  const raf = useRef<number | null>(null);
  const lastT = useRef(0);
  const hovering = useRef(false);
  const sinceEmit = useRef(0);
  const emitKey = useRef(0);

  const [emissions, setEmissions] = useState<Emission[]>([]);

  const paint = useCallback(() => {
    const el = skinRef.current;
    if (!el) return;
    // One full turn consumes exactly one tile, i.e. half the doubled skin.
    const progress = (((angle.current % 360) + 360) % 360) / 360;
    el.style.transform = `translate3d(${(-progress * 50).toFixed(3)}%,0,0)`;
  }, []);

  const emit = useCallback(() => {
    if (reduced) return;
    const key = emitKey.current++;
    const drift = ((key * 37) % 40) - 20; // deterministic spread, never Math.random
    setEmissions((list) => [...list.slice(-4), { key, drift }]);
  }, [reduced]);

  const start = useCallback(() => {
    if (raf.current !== null) return;
    lastT.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;

      if (hovering.current) {
        // Ease up to speed rather than snapping — a drum has mass.
        omega.current += (HOVER_OMEGA - omega.current) * Math.min(SPIN_UP * dt, 1);
        omega.current = clampSpin(omega.current); // clockwise only
      } else {
        omega.current = decayOmega(omega.current, dt);
      }

      angle.current += omega.current * dt;
      paint();

      // A syllable goes out roughly every half turn.
      sinceEmit.current += omega.current * dt;
      if (sinceEmit.current > 180) {
        sinceEmit.current = 0;
        emit();
      }

      if (!hovering.current && omega.current < REST_OMEGA) {
        omega.current = 0;
        raf.current = null; // at rest — shut the loop down completely
        return;
      }
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
  }, [paint, emit]);

  const engage = useCallback(() => {
    if (reduced) return;
    hovering.current = true;
    onSpin();
    start();
  }, [reduced, onSpin, start]);

  const release = useCallback(() => {
    hovering.current = false; // the loop coasts it down and then stops itself
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (reduced) {
        onSpin();
        return;
      }
      // A push, on top of whatever it is already doing.
      omega.current = clampSpin(omega.current + 420);
      onSpin();
      start();
    }
  };

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    []
  );

  return (
    <div className="relative flex flex-col items-center">
      {/* The mantra, released by the turning drum */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-24" aria-hidden>
        {carved &&
          emissions.map((em) => (
            <span
              key={em.key}
              className="mantra-emit mani-mantra"
              style={{ ["--drift" as string]: `${em.drift}px` }}
              onAnimationEnd={() => setEmissions((l) => l.filter((x) => x.key !== em.key))}
            >
              {OM_MANI_PADME_HUM}
            </span>
          ))}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Prayer wheel ${index + 1} of ${WHEELS}. Hover or press Enter to turn it clockwise.`}
        onPointerEnter={engage}
        onPointerLeave={release}
        onFocus={engage}
        onBlur={release}
        onKeyDown={onKeyDown}
        className="mani-wheel"
      >
        {/* Ornate domed lid */}
        <span aria-hidden className="mani-wheel-lid">
          <span className="mani-wheel-finial" />
        </span>

        {/* The drum: a clipped window onto the turning skin */}
        <span aria-hidden className="mani-wheel-drum">
          <span ref={skinRef} className="mani-wheel-skin">
            <WheelTile carved={carved} />
            <WheelTile carved={carved} />
          </span>
          {/* Fixed lighting — does not turn with the metal */}
          <span className="mani-wheel-sheen" />
        </span>

        {/* Hanging ring and the pin it turns on */}
        <span aria-hidden className="mani-wheel-ring" />
        <span aria-hidden className="mani-wheel-foot" />
      </div>
    </div>
  );
}

/**
 * One repeat of the chased surface. Two of these sit side by side inside the
 * skin so the translate can loop without a seam.
 *
 * The register stack follows the object: brass meander band, copper
 * scrollwork, a raised mantra course, scrollwork, meander band.
 */
function WheelTile({ carved }: { carved: boolean }) {
  return (
    <span className="mani-wheel-tile">
      <span className="mwt-key mwt-key-top" />
      <span className="mwt-rule" />
      <span className="mwt-scroll" />
      <span className="mwt-bead" />
      <span className="mwt-mantra">
        {carved && (
          <>
            {/* Repoussé: the character is raised, so the light catches its top
                edge and it casts downward. Three passes — highlight, shadow,
                then the face of the metal. */}
            <span className="mwt-mantra-hi">{OM_MANI_PADME_HUM}</span>
            <span className="mwt-mantra-lo">{OM_MANI_PADME_HUM}</span>
            <span className="mwt-mantra-face">{OM_MANI_PADME_HUM}</span>
          </>
        )}
      </span>
      <span className="mwt-bead" />
      <span className="mwt-scroll" />
      <span className="mwt-rule" />
      <span className="mwt-key mwt-key-bottom" />
    </span>
  );
}
