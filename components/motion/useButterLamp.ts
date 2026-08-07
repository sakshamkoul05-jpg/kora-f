"use client";

import { useCallback, useEffect, useRef } from "react";
import { makeNoise } from "@/lib/noise";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Amplitude. A butter lamp in a still room barely moves — most of the flicker
// people picture is a draught. Keep this low: if you notice it at a glance it
// is too strong, and the instruction is to halve it.
const MIN = 0.26;
const MAX = 0.46;
const REST = 0.36; // steady value used under reduced motion

/**
 * Butter lamp glow for primary CTAs.
 *
 * Flame is not a sine wave, so this is driven by a small looping noise value
 * rather than a smooth pulse. Only OPACITY is animated — the glow itself is a
 * static box-shadow painted once on a child span, so the per-frame work stays
 * on the compositor and never repaints the button.
 *
 * The loop runs only while hovered or focused, and stops on leave.
 */
export function useButterLamp<T extends HTMLElement>() {
  const flameRef = useRef<T | null>(null);
  const raf = useRef<number | null>(null);
  const reduced = useReducedMotion();

  const stop = useCallback(() => {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    if (flameRef.current) flameRef.current.style.opacity = "0";
  }, []);

  const light = useCallback(() => {
    const el = flameRef.current;
    if (!el) return;

    if (reduced) {
      // Instant state change, no motion — the reduced-motion contract.
      el.style.opacity = String(REST);
      return;
    }
    if (raf.current !== null) return;

    const noise = makeNoise(6, 21, 3);
    const t0 = performance.now();
    const frame = (now: number) => {
      const n = noise((((now - t0) / 1000) * 1.6));
      el.style.opacity = (MIN + n * (MAX - MIN)).toFixed(3);
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  }, [reduced]);

  useEffect(() => () => stop(), [stop]);

  return {
    flameRef,
    handlers: {
      onMouseEnter: light,
      onMouseLeave: stop,
      onFocus: light,
      onBlur: stop,
    },
  };
}
