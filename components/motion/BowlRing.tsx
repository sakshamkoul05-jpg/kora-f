"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  RING_COUNT,
  STRIKE_DURATION,
  reachFrom,
  ringOpacity,
  ringProgress,
  ringRadius,
} from "@/lib/bowl-ring";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * A struck singing bowl.
 *
 * Rings leave the point of contact, widen, and fade — fast away from the
 * strike then slowing, with each ring quieter than the last so the three read
 * as one event rather than three. The maths is in lib/bowl-ring.ts and is
 * tested there; this file only draws it.
 *
 * Used on the PRIMARY action and nowhere else. A bowl struck on every button
 * is not a bowl, it is a tic — the restraint is the point. See MOTION.md.
 *
 * Only `transform` and `opacity` are written per frame, so the whole thing
 * stays on the compositor. Under prefers-reduced-motion no rings are created
 * at all; the button behaves exactly as it would without this wrapper.
 */

type Strike = { id: number; x: number; y: number; reach: number };

export function BowlRing({
  children,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const nextId = useRef(0);
  const idBase = useId();

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      if (reduced || disabled) return;
      const host = hostRef.current;
      if (!host) return;
      const box = host.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const id = nextId.current++;
      setStrikes((current) => [
        ...current,
        { id, x, y, reach: reachFrom(x, y, box.width, box.height) },
      ]);
    },
    [reduced, disabled]
  );

  const retire = useCallback((id: number) => {
    setStrikes((current) => current.filter((s) => s.id !== id));
  }, []);

  return (
    <span
      ref={hostRef}
      onPointerDown={onPointerDown}
      className={`relative isolate inline-flex overflow-hidden ${className}`}
    >
      {children}
      {strikes.map((strike) => (
        <Rings key={`${idBase}-${strike.id}`} strike={strike} onDone={retire} />
      ))}
    </span>
  );
}

function Rings({ strike, onDone }: { strike: Strike; onDone: (id: number) => void }) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;

    // Local recursive function rather than a self-referential useCallback,
    // which the React Compiler rejects.
    const step = (now: number) => {
      const elapsed = now - start;

      for (let i = 0; i < RING_COUNT; i++) {
        const node = refs.current[i];
        if (!node) continue;
        const p = ringProgress(elapsed, i);
        const r = ringRadius(p, strike.reach);
        // Drawn as a 2px-wide circle scaled from nothing, so only transform
        // and opacity ever change — no layout, no paint of a growing box.
        node.style.transform = `translate(-50%, -50%) scale(${Math.max(r, 0.01)})`;
        node.style.opacity = String(ringOpacity(p, i));
      }

      if (elapsed < STRIKE_DURATION) {
        frame = requestAnimationFrame(step);
      } else {
        onDone(strike.id);
      }
    };

    frame = requestAnimationFrame(step);

    // A tab hidden mid-strike would otherwise leave the rings frozen on the
    // button until it came back. Belt and braces: retire on unmount too.
    const timeout = window.setTimeout(() => onDone(strike.id), STRIKE_DURATION + 400);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [strike, onDone]);

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <span
          key={i}
          ref={(node) => {
            refs.current[i] = node;
          }}
          className="bowl-ring"
          style={{ left: strike.x, top: strike.y, opacity: 0 }}
        />
      ))}
    </span>
  );
}
