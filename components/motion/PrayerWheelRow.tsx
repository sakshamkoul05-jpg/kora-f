"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { OM_MANI_PADME_HUM, ensureTibetan } from "@/lib/mantra";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { REST_OMEGA, clampSpin, decayOmega, resolveDrag } from "@/lib/wheel-physics";

const FACES = 20;
const RADIUS = 40;
const FACE_W = 13.2; // 2·R·tan(π/N), a shade over so the seams close
const DRUM_H = 104;
const WHEELS = 5;
const DEG_PER_PX = 0.7;

/**
 * A wall of mani wheels — five brass drums in a row, as they are set along the
 * kora wall below the house.
 *
 * Each drum is a real cylinder (`preserve-3d`, 20 vertical faces), so spinning
 * one costs a single transform on its parent rather than a restyle of every
 * face. The lighting is a static overlay that does NOT rotate: the light stays
 * in the room and the brass turns through it, which is what makes it read as
 * metal rather than as a spinning graphic.
 *
 * CLOCKWISE ONLY, enforced in lib/wheel-physics.ts and unit tested. Dragging a
 * drum anticlockwise is damped and springs back.
 *
 * Two gestures, because both are real:
 *   - drag a single drum, or
 *   - sweep the pointer along the row with the button down, which sets each
 *     drum turning as you pass it — the way you actually walk a wall of wheels,
 *     brushing them with one hand.
 *
 * Spinning a drum releases the mantra: the syllables rise off it and fade. That
 * is what the object is for — the wheel turns so the mantra goes out.
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
    <div className="flex flex-col items-center gap-5">
      <div
        className="flex items-end justify-center gap-3 sm:gap-5"
        role="group"
        aria-label="A row of five prayer wheels. Drag one clockwise, or sweep across them, to spin."
      >
        {Array.from({ length: WHEELS }, (_, i) => (
          <Wheel key={i} index={i} carved={carved} reduced={reduced} onSpin={handleSpin} />
        ))}
      </div>
      <p className="font-data text-[11px] tracking-[0.14em] text-ink/40">
        {reduced ? "SPIN DISABLED — REDUCED MOTION" : "DRAG OR SWEEP ACROSS · CLOCKWISE"}
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
  const uid = useId().replace(/:/g, "");
  const drumRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const omega = useRef(0);
  const raf = useRef<number | null>(null);
  const lastT = useRef(0);
  const sinceEmit = useRef(0);
  const emitKey = useRef(0);

  const dragging = useRef(false);
  const dragStartAngle = useRef(0);
  const lastX = useRef(0);
  const samples = useRef<{ t: number; a: number }[]>([]);
  const returning = useRef(false);
  const returnFrom = useRef(0);
  const returnStart = useRef(0);

  const [emissions, setEmissions] = useState<Emission[]>([]);

  const paint = useCallback(() => {
    const el = drumRef.current;
    if (el) el.style.transform = `rotateY(${angle.current}deg)`;
  }, []);

  const stop = useCallback(() => {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    omega.current = 0;
  }, []);

  /** Release a syllable. Capped, and never under reduced motion. */
  const emit = useCallback(() => {
    if (reduced) return;
    const key = emitKey.current++;
    const drift = ((key * 37) % 40) - 20; // deterministic spread, no Math.random
    setEmissions((list) => [...list.slice(-4), { key, drift }]);
  }, [reduced]);

  const start = useCallback(() => {
    if (raf.current !== null) return;
    lastT.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;

      if (returning.current) {
        const p = Math.min((now - returnStart.current) / 320, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        angle.current = returnFrom.current + (dragStartAngle.current - returnFrom.current) * eased;
        paint();
        if (p >= 1) {
          returning.current = false;
          raf.current = null;
          return;
        }
        raf.current = requestAnimationFrame(step);
        return;
      }

      omega.current = decayOmega(omega.current, dt);
      angle.current += omega.current * dt;
      paint();

      // A syllable goes out roughly every half turn, while it is turning.
      sinceEmit.current += omega.current * dt;
      if (sinceEmit.current > 180) {
        sinceEmit.current = 0;
        emit();
      }

      if (omega.current < REST_OMEGA) {
        stop(); // at rest — shut the loop down completely, no idle spin
        return;
      }
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
  }, [paint, stop, emit]);

  const spin = useCallback(
    (velocity: number) => {
      if (reduced) return;
      const v = clampSpin(velocity); // clockwise only
      if (v <= REST_OMEGA) return;
      omega.current = Math.max(omega.current, v);
      onSpin();
      start();
    },
    [reduced, start, onSpin]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (reduced) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    stop();
    returning.current = false;
    dragging.current = true;
    dragStartAngle.current = angle.current;
    lastX.current = e.clientX;
    samples.current = [{ t: performance.now(), a: angle.current }];
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    const delta = resolveDrag(dx * DEG_PER_PX, angle.current, dragStartAngle.current);
    angle.current += delta;
    paint();
    const now = performance.now();
    samples.current.push({ t: now, a: angle.current });
    while (samples.current.length > 2 && now - samples.current[0].t > 90) samples.current.shift();
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const s = samples.current;
    let v = 0;
    if (s.length >= 2) {
      const dtms = s[s.length - 1].t - s[0].t;
      if (dtms > 0) v = ((s[s.length - 1].a - s[0].a) / dtms) * 1000;
    }
    if (angle.current < dragStartAngle.current || v < 0) {
      returning.current = true;
      returnFrom.current = angle.current;
      returnStart.current = performance.now();
      start();
      return;
    }
    spin(v);
  };

  /** Sweeping along the row with the button held sets each drum going. */
  const onPointerEnter = (e: React.PointerEvent) => {
    if (reduced || dragging.current) return;
    if (e.buttons === 1) spin(520);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      if (reduced) {
        onSpin();
        return;
      }
      spin(Math.max(omega.current, 0) + 600);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault(); // clockwise only — deliberately inert
    }
  };

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Mantra released by the turning drum */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-24" aria-hidden>
        {carved &&
          emissions.map((em) => (
            <span
              key={em.key}
              className="mantra-emit mani-mantra"
              style={{ ["--drift" as string]: `${em.drift}px` }}
              onAnimationEnd={() =>
                setEmissions((list) => list.filter((x) => x.key !== em.key))
              }
            >
              {OM_MANI_PADME_HUM}
            </span>
          ))}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Prayer wheel ${index + 1} of ${WHEELS}. Drag clockwise or press Enter to spin.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={onPointerEnter}
        onKeyDown={onKeyDown}
        className="prayer-wheel-stage relative cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ width: RADIUS * 2 + 16, height: DRUM_H + 34 }}
      >
        {/* Spindle, above and below the drum */}
        <span aria-hidden className="wheel-spindle" />

        <div className="prayer-wheel-scene absolute inset-0 flex items-center justify-center">
          <div ref={drumRef} className="prayer-wheel-drum" style={{ height: DRUM_H }}>
            {Array.from({ length: FACES }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className="prayer-wheel-face"
                style={{
                  width: FACE_W,
                  height: DRUM_H,
                  marginLeft: -FACE_W / 2,
                  transform: `rotateY(${(360 / FACES) * i}deg) translateZ(${RADIUS}px)`,
                }}
              />
            ))}
          </div>

          {/* Fixed lighting and hardware. None of this rotates. */}
          <span aria-hidden className="wheel-sheen" style={{ width: RADIUS * 2, height: DRUM_H }} />
          <span aria-hidden className="wheel-band" style={{ width: RADIUS * 2, top: 30 }} />
          <span aria-hidden className="wheel-band" style={{ width: RADIUS * 2, bottom: 30 }} />
          <span aria-hidden className="wheel-cap wheel-cap-top" style={{ width: RADIUS * 2 + 8 }} />
          <span aria-hidden className="wheel-cap wheel-cap-bottom" style={{ width: RADIUS * 2 + 8 }} />
        </div>
        <span className="sr-only">{`Wheel ${index + 1}`}</span>
        <span aria-hidden className="sr-only">{uid}</span>
      </div>
    </div>
  );
}
