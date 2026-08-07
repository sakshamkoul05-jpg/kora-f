"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { REST_OMEGA, clampSpin, decayOmega, resolveDrag } from "@/lib/wheel-physics";

const FACES = 24;
const RADIUS = 64; // px
const FACE_W = 17.6; // 2·R·tan(π/N), rounded up slightly so the seams close
const DRUM_H = 118;

const DEG_PER_PX = 0.55;

// The physics itself lives in lib/wheel-physics.ts and is unit tested —
// including that a firm spin coasts for several seconds, that the drum truly
// reaches rest so this loop can stop, and that it never turns anticlockwise.
// Keep the rules there, not here.

/**
 * The prayer wheel — the entry point to the kora route.
 *
 * Rendered as a DRUM, not a disc: `transform-style: preserve-3d` with 24
 * vertical faces rotated around the Y axis. A flat spinning circle is the tell
 * of a wheel nobody looked at. Because it is a real 3D cylinder, the physics
 * loop writes exactly ONE transform per frame (on the parent) rather than
 * restyling every face, so it composites cheaply.
 *
 * The light is a static overlay that does NOT rotate — the lighting is fixed in
 * the room and the faces turn through it, which is what actually happens.
 *
 * CLOCKWISE ONLY. Dragging anticlockwise meets heavy resistance and springs
 * back on release. This is a correctness constraint, not a preference: the kora
 * is walked clockwise and a wheel turned the other way is simply wrong.
 *
 * The rAF loop stops dead once the drum is at rest. It never idle-spins.
 */
export function PrayerWheel({ onSpin }: { onSpin?: () => void }) {
  const drumRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const omega = useRef(0);
  const raf = useRef<number | null>(null);
  const lastT = useRef(0);
  const travelled = useRef(0);
  const announced = useRef(false);

  // Drag bookkeeping
  const dragging = useRef(false);
  const dragStartAngle = useRef(0);
  const lastX = useRef(0);
  const samples = useRef<{ t: number; a: number }[]>([]);
  const returning = useRef(false);
  const returnFrom = useRef(0);
  const returnStart = useRef(0);

  const reduced = useReducedMotion();

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

  const noteTravel = useCallback(
    (delta: number) => {
      travelled.current += Math.abs(delta);
      if (!announced.current && travelled.current >= 360) {
        announced.current = true;
        onSpin?.();
      }
    },
    [onSpin]
  );

  // `step` is a local function so it can recurse; a self-referential
  // useCallback trips the compiler's immutability rule.
  const start = useCallback(() => {
    if (raf.current !== null) return;
    lastT.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastT.current) / 1000, 0.05);
      lastT.current = now;

      if (returning.current) {
        // Anticlockwise attempt: ease back to where the drag began.
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

      // Coast under friction.
      omega.current = decayOmega(omega.current, dt);
      const delta = omega.current * dt;
      angle.current += delta;
      noteTravel(delta);
      paint();

      if (omega.current < REST_OMEGA) {
        // Come to rest and shut the loop down completely. No idle spin.
        stop();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
  }, [paint, stop, noteTravel]);

  const spin = useCallback(
    (velocity: number) => {
      if (reduced) return;
      omega.current = clampSpin(velocity); // clockwise only
      if (omega.current > REST_OMEGA) start();
    },
    [reduced, start]
  );

  // --- pointer ---
  const onPointerDown = (e: React.PointerEvent) => {
    if (reduced) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
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

    // Resists any motion that would carry the drum anticlockwise of where the
    // gesture began.
    const delta = resolveDrag(dx * DEG_PER_PX, angle.current, dragStartAngle.current);
    angle.current += delta;
    noteTravel(delta);
    paint();

    const now = performance.now();
    samples.current.push({ t: now, a: angle.current });
    // keep ~90ms of history for the release velocity
    while (samples.current.length > 2 && now - samples.current[0].t > 90) samples.current.shift();
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;

    const s = samples.current;
    let v = 0;
    if (s.length >= 2) {
      const first = s[0];
      const last = s[s.length - 1];
      const dtms = last.t - first.t;
      if (dtms > 0) v = ((last.a - first.a) / dtms) * 1000;
    }

    if (angle.current < dragStartAngle.current || v < 0) {
      // They pulled it backwards. It resists, and returns.
      returning.current = true;
      returnFrom.current = angle.current;
      returnStart.current = performance.now();
      start();
      return;
    }
    spin(v);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      if (reduced) {
        onSpin?.();
        return;
      }
      spin(Math.max(omega.current, 0) + 620);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault(); // clockwise only — nothing to do
    }
  };

  useEffect(() => () => stop(), [stop]);

  const faces = Array.from({ length: FACES }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Prayer wheel. Drag clockwise, or press Enter, to spin it and reveal the kora route."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="prayer-wheel-stage relative cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ width: RADIUS * 2 + 40, height: DRUM_H + 64 }}
      >
        {/* Spindle */}
        <span
          aria-hidden
          className="absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-ink/25"
        />

        <div className="prayer-wheel-scene absolute inset-0 flex items-center justify-center">
          <div ref={drumRef} className="prayer-wheel-drum" style={{ height: DRUM_H }}>
            {faces.map((i) => (
              <span
                key={i}
                aria-hidden
                className="prayer-wheel-face"
                style={{
                  width: FACE_W,
                  height: DRUM_H,
                  transform: `rotateY(${(360 / FACES) * i}deg) translateZ(${RADIUS}px)`,
                }}
              />
            ))}
          </div>

          {/* Fixed lighting + caps. These do NOT rotate: the light stays in the
              room and the drum turns through it. */}
          <span aria-hidden className="prayer-wheel-shade" style={{ width: RADIUS * 2, height: DRUM_H }} />
          <span aria-hidden className="prayer-wheel-cap" style={{ width: RADIUS * 2, top: 22 }} />
          <span aria-hidden className="prayer-wheel-cap" style={{ width: RADIUS * 2, bottom: 22 }} />
        </div>
      </div>

      <p className="font-data text-[11px] tracking-[0.14em] text-ink/40">
        {reduced ? "SPIN DISABLED — REDUCED MOTION" : "DRAG CLOCKWISE TO SPIN"}
      </p>
    </div>
  );
}
