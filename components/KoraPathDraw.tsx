"use client";

import { useEffect, useRef, useState } from "react";

// A stylised diagram of the circumambulation, not a survey map.
//
// Label placement is the whole problem here. The previous version pinned
// every label at `x + 9` with the default start-anchor, so labels on the
// left half ran back across the ring, and it carried a marker at t=0.97
// alongside one at t=0.04 — 7% apart on a CLOSED loop, i.e. printed on top
// of each other. Both are fixed below: each label is pushed radially outward
// from the centre and anchored according to which side it sits on, and the
// return marker is gone (returning to the start is what a kora *is* — it
// doesn't need its own pin).
const MARKERS = [
  { at: 0.0, label: "Kora House", start: true },
  { at: 0.2, label: "Tsuglagkhang" },
  { at: 0.42, label: "Lhagyal Ri" },
  { at: 0.63, label: "Bhagsu road" },
  { at: 0.83, label: "Dharamkot" },
] as const;

// Deliberately not a true circle — the control points are nudged off-round so
// it reads as drawn by hand rather than struck with a compass.
const PATH_D =
  "M 262,42 C 372,38 456,112 462,214 C 468,318 380,404 258,402 C 142,400 58,326 56,220 C 54,116 146,46 262,42 Z";

const CENTER = { x: 259, y: 222 };

type Placed = {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: "start" | "middle" | "end";
};

export function KoraPathDraw() {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [length, setLength] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [drawn, setDrawn] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const path = pathRef.current;
    if (path) {
      const total = path.getTotalLength();
      setLength(total);
      setPlaced(
        MARKERS.map((m) => {
          const p = path.getPointAtLength(total * m.at);
          // Unit vector pointing away from the centre of the ring.
          const dx = p.x - CENTER.x;
          const dy = p.y - CENTER.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;

          // Anchor by side, so a label never runs back over the ring.
          const anchor: Placed["anchor"] = ux > 0.32 ? "start" : ux < -0.32 ? "end" : "middle";

          // Vertical nudge: top labels sit above their pin, bottom ones below,
          // otherwise they'd straddle it.
          const vNudge = anchor === "middle" ? (uy < 0 ? -10 : 18) : 4;

          return {
            x: p.x,
            y: p.y,
            labelX: p.x + ux * 20,
            labelY: p.y + uy * 20 + vNudge,
            anchor,
          };
        })
      );
    }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const active = drawn || reduced;

  return (
    <div ref={containerRef} className="relative mx-auto max-w-xl">
      {/* Generous viewBox padding so outward-pushed labels are never clipped. */}
      <svg viewBox="-90 -12 700 486" className="w-full text-ink">
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.55"
          style={
            reduced || !length
              ? undefined
              : {
                  strokeDasharray: length,
                  strokeDashoffset: active ? 0 : length,
                  transition: "stroke-dashoffset 2.4s ease-in-out",
                }
          }
        />

        {/* Centre mark: the walk is clockwise, and that direction is doctrinal
            rather than decorative, so it is stated plainly. */}
        <g
          style={{
            opacity: active ? 1 : 0,
            transition: reduced ? undefined : "opacity 500ms ease-out 1.5s",
          }}
        >
          <path
            d="M 236,206 a 23,23 0 1 1 -0.4,3"
            fill="none"
            stroke="var(--color-butter)"
            strokeWidth="1.2"
            opacity="0.8"
          />
          <path d="M 233,196 l 4,10 -10.5,1.5 z" fill="var(--color-butter)" opacity="0.9" />
          <text
            x={CENTER.x}
            y={CENTER.y + 46}
            textAnchor="middle"
            fontSize="12"
            letterSpacing="0.2em"
            fill="currentColor"
            opacity="0.5"
            className="font-data"
          >
            CLOCKWISE
          </text>
        </g>

        {MARKERS.map((m, i) => {
          const p = placed[i];
          if (!p) return null;
          return (
            <g
              key={m.label}
              style={{
                opacity: active ? 1 : 0,
                transition: reduced ? undefined : `opacity 400ms ease-out ${0.3 + i * 0.32}s`,
              }}
            >
              {"start" in m && m.start ? (
                <>
                  <circle cx={p.x} cy={p.y} r={7} fill="none" stroke="var(--color-maroon)" strokeWidth="1.2" />
                  <circle cx={p.x} cy={p.y} r={3.5} fill="var(--color-maroon)" />
                </>
              ) : (
                <circle cx={p.x} cy={p.y} r={4} fill="var(--color-maroon)" />
              )}
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={p.anchor}
                fontSize="13"
                fill="currentColor"
                className="font-data"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
