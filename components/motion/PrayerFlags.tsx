"use client";

import { useEffect, useRef } from "react";
import { jitter, round3 } from "@/lib/deterministic";
import { makeNoise } from "@/lib/noise";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Lungta strung between two rooftops.
//
// COLOUR ORDER IS FIXED: blue, white, red, green, yellow — sky, air, fire,
// water, earth. It is never reshuffled for visual balance. See MOTION.md.
const CLOTH = ["#4a6b88", "#e6ddc9", "#8c3341", "#4e6553", "#d2a44f"];

// The string sags. Quadratic bezier: left anchor, sag, right anchor.
const P0 = { x: -12, y: 48 };
const P1 = { x: 400, y: 176 };
const P2 = { x: 812, y: 66 };

const pointAt = (t: number) => ({
  x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x,
  y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y,
});

// Tangent, so each flag hangs square to the string rather than square to the page.
const angleAt = (t: number) => {
  const dx = 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
  const dy = 2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

const FLAG_COUNT = 16;

// Geometry is computed once at module scope and is server-rendered, so every
// number here must be byte-identical on Node and in the browser: integer-hash
// jitter only, and everything rounded. See lib/deterministic.ts.
const flags = Array.from({ length: FLAG_COUNT }, (_, i) => {
  const t = 0.045 + (i / (FLAG_COUNT - 1)) * 0.91;
  const p = pointAt(t);
  const tilt = (jitter(i, 3) - 0.5) * 7;
  return {
    x: round3(p.x),
    y: round3(p.y),
    rotate: round3(angleAt(t) + tilt),
    w: round3(30 + jitter(i, 1) * 7),
    h: round3(40 + jitter(i, 2) * 12),
    fill: CLOTH[i % CLOTH.length],
    opacity: round3(0.52 + jitter(i, 4) * 0.26),
  };
});

const WIND_MS = 8000; // stillness after this long without interaction

export function PrayerFlags() {
  const rootRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const cloths = Array.from(root.querySelectorAll<SVGGElement>("[data-cloth]"));
    if (cloths.length === 0) return;

    // One noise generator per flag, each with its own seed and period, so they
    // gust independently and never fall into visible sync. Wind is gusty, not
    // periodic — this is the whole reason it isn't a sine.
    const gusts = cloths.map((_, i) => makeNoise(7 + (i % 5), i * 13 + 3, 2));
    const swayAmp = cloths.map((_, i) => 2.2 + jitter(i, 9) * 2.6);
    const skewAmp = cloths.map((_, i) => 1.6 + jitter(i, 11) * 2.2);

    let raf: number | null = null;
    let windUntil = performance.now() + WIND_MS;
    const t0 = performance.now();

    const rest = () => {
      cloths.forEach((el) => {
        el.style.transform = "";
      });
    };

    const frame = (now: number) => {
      // Envelope: eases to zero as the gust window runs out, so the wind dies
      // down rather than being switched off.
      const remaining = (windUntil - now) / WIND_MS;
      const env = Math.max(0, Math.min(1, remaining));
      const eased = env * env * (3 - 2 * env);

      if (eased <= 0.001) {
        rest();
        raf = null; // stop the loop completely; a still page costs nothing
        return;
      }

      const t = (now - t0) / 1000;
      for (let i = 0; i < cloths.length; i++) {
        const n = gusts[i](t * 0.55) * 2 - 1; // -1..1
        const rot = n * swayAmp[i] * eased;
        const skew = -n * skewAmp[i] * eased;
        cloths[i].style.transform = `rotate(${rot.toFixed(2)}deg) skewX(${skew.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      windUntil = performance.now() + WIND_MS;
      if (raf === null) raf = requestAnimationFrame(frame);
    };

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      rest();
    };
  }, [reduced]);

  return (
    <svg
      ref={rootRef}
      aria-hidden
      viewBox="0 0 800 240"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-52 w-full"
    >
      <path
        d={`M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
        fill="none"
        stroke="rgba(28,20,14,0.5)"
        strokeWidth="1.4"
      />

      {flags.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.rotate + 90})`}>
          <g data-cloth style={{ transformBox: "fill-box", transformOrigin: "top center" }}>
            <path
              d={`M ${round3(-f.w / 2)} 0 L ${round3(f.w / 2)} 0 L ${round3(f.w / 2 + 1.5)} ${round3(f.h - 4)} Q 0 ${round3(f.h + 6)} ${round3(-f.w / 2 - 1)} ${round3(f.h - 2)} Z`}
              fill={f.fill}
              opacity={f.opacity}
            />
            <path
              d={`M ${round3(-f.w / 6)} 0 L ${round3(-f.w / 6 + 1)} ${round3(f.h - 3)}`}
              stroke="rgba(28,20,14,0.14)"
              strokeWidth="2.5"
              fill="none"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}
