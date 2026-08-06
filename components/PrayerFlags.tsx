"use client";

import { useEffect, useRef } from "react";

// Lungta strung between two rooftops. The previous version was ten flat,
// fully-saturated rectangles in a straight row, which read as cartoon
// bunting. Real flags differ in every one of those respects:
//
//   - the line SAGS (a catenary), it is never horizontal
//   - each flag hangs perpendicular to the line's local slope
//   - the cloth is thin, sun-bleached and semi-transparent, not poster colour
//   - widths, lengths and hems are all slightly irregular
//   - the hem droops in the middle under the cloth's own weight
//
// Traditional order, repeating: blue, white, red, green, yellow
// (sky, air, fire, water, earth). That order is fixed and meaningful — it is
// not a palette choice, so it is not randomised.

const CLOTH = [
  { fill: "#4a6b88", label: "sky" },
  { fill: "#e6ddc9", label: "air" },
  { fill: "#8c3341", label: "fire" },
  { fill: "#4e6553", label: "water" },
  { fill: "#d2a44f", label: "earth" },
];

// Quadratic bezier describing the string: left anchor, sag, right anchor.
const P0 = { x: -12, y: 48 };
const P1 = { x: 400, y: 176 };
const P2 = { x: 812, y: 66 };

// Every number below ends up in an SSR'd `d` attribute, so it has to be
// byte-identical on server and client. Two rules make that true:
//
//   1. No transcendental functions in the jitter. Math.sin/Math.random are
//      implementation-defined to the last ULP, so Node and the browser can
//      disagree and React reports a hydration mismatch. This uses an
//      integer-only hash (imul/xor/shift), which is exact everywhere.
//   2. Round everything that reaches the DOM. atan2 is still needed for the
//      tangent and carries the same ULP risk, but a 1e-11 discrepancy cannot
//      survive rounding to three decimals.
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const hash = (n: number) => {
  let x = n >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519);
  x ^= x >>> 13;
  x = Math.imul(x, 3266489917);
  x ^= x >>> 16;
  return x >>> 0;
};

/** Deterministic 0..1 from an index and a seed. Integer ops only. */
const jitter = (i: number, seed: number) =>
  hash(Math.imul(i + 1, 73856093) ^ Math.imul(seed + 1, 19349663)) / 4294967296;

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

const flags = Array.from({ length: FLAG_COUNT }, (_, i) => {
  const t = 0.045 + (i / (FLAG_COUNT - 1)) * 0.91;
  const cloth = CLOTH[i % CLOTH.length];
  const p = pointAt(t);
  // A little slack in how each one was tied on.
  const tilt = (jitter(i, 3) - 0.5) * 7;
  return {
    x: round3(p.x),
    y: round3(p.y),
    rotate: round3(angleAt(t) + tilt),
    w: round3(30 + jitter(i, 1) * 7),
    h: round3(40 + jitter(i, 2) * 12),
    fill: cloth.fill,
    // Older flags higher up the line are more bleached.
    opacity: round3(0.52 + jitter(i, 4) * 0.26),
    swayClass: i % 2 === 0 ? "cloth-sway-a" : "cloth-sway-b",
    delay: `${(i * 210) % 1900}ms`,
  };
});

export function PrayerFlags() {
  const rootRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cloths = Array.from(root.querySelectorAll<SVGGElement>("[data-cloth]"));
    const setSwaying = (on: boolean) => {
      cloths.forEach((el) => {
        const cls = el.dataset.sway;
        if (cls) el.classList.toggle(cls, on);
      });
    };

    let idleTimer: ReturnType<typeof setTimeout>;
    const stop = () => setSwaying(false);
    const restart = () => {
      setSwaying(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(stop, 5000);
    };

    restart();
    window.addEventListener("scroll", restart, { passive: true });
    window.addEventListener("pointermove", restart, { passive: true });
    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener("scroll", restart);
      window.removeEventListener("pointermove", restart);
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      aria-hidden
      viewBox="0 0 800 240"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-52 w-full"
    >
      {/* The string itself — thin, dark, slightly slack */}
      <path
        d={`M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
        fill="none"
        stroke="rgba(28,20,14,0.5)"
        strokeWidth="1.4"
      />

      {flags.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.rotate + 90})`}>
          <g
            data-cloth
            data-sway={f.swayClass}
            style={{
              transformBox: "fill-box",
              transformOrigin: "top center",
              animationDelay: f.delay,
            }}
          >
            {/* Cloth: tapers slightly toward the free edge, hem droops under
                its own weight. Coordinates rounded so SSR and client markup
                match exactly. */}
            <path
              d={`M ${round3(-f.w / 2)} 0 L ${round3(f.w / 2)} 0 L ${round3(f.w / 2 + 1.5)} ${round3(f.h - 4)} Q 0 ${round3(f.h + 6)} ${round3(-f.w / 2 - 1)} ${round3(f.h - 2)} Z`}
              fill={f.fill}
              opacity={f.opacity}
            />
            {/* Fold shadow down the cloth, so it reads as fabric not a swatch */}
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
