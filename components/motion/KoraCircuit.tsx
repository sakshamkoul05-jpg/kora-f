"use client";

import { useEffect, useRef, useState } from "react";
import { KORA_PATH_D, koraWaypoints } from "@/lib/kora-route";

type Placed = {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: "start" | "middle" | "end";
};

// Centroid of the loop, used to push labels radially outward. Keep in step
// with KORA_PATH_D.
const CENTER = { x: 292, y: 256 };

/**
 * The kora circuit — the spine of the Experiences page.
 *
 * Drawn with `stroke-dasharray` progression as the reader scrolls. That is the
 * one documented exception to the "transform and opacity only" rule: both the
 * build spec and the interaction brief name stroke-dasharray explicitly for
 * this component. It repaints a single thin path on its own layer, which
 * profiles fine; it does not trigger layout.
 *
 * Two drive mechanisms, in preference order:
 *   1. Native scroll-driven animation (`animation-timeline: view()`), which
 *      runs off the main thread. `pathLength="1"` normalises the path so the
 *      dash offset animates 1 -> 0 in pure CSS with no JS measurement at all.
 *   2. An IntersectionObserver fallback that plays it once on entry.
 * Never a scroll event listener.
 *
 * Marker placement is measured once from the path so the pins sit exactly on
 * the line. Labels are pushed radially outward and anchored by side — pinning
 * every label to `x + 9` is what made an earlier version overlap itself.
 */
export function KoraCircuit() {
  const pathRef = useRef<SVGPathElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    // getTotalLength reflects the real geometry even with pathLength="1" set.
    const total = path.getTotalLength();
    setPlaced(
      koraWaypoints.map((w) => {
        const p = path.getPointAtLength(total * w.at);
        const dx = p.x - CENTER.x;
        const dy = p.y - CENTER.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const anchor: Placed["anchor"] = ux > 0.32 ? "start" : ux < -0.32 ? "end" : "middle";
        const vNudge = anchor === "middle" ? (uy < 0 ? -14 : 26) : 5;
        return {
          x: p.x,
          y: p.y,
          labelX: p.x + ux * 22,
          labelY: p.y + uy * 22 + vNudge,
          anchor,
        };
      })
    );
  }, []);

  // Fallback driver. Harmless when native scroll timelines are supported —
  // the @supports block in globals.css overrides the transition path.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`relative mx-auto max-w-2xl ${live ? "kora-live" : ""}`}>
      <svg viewBox="-110 -20 820 560" className="w-full text-ink" role="img"
        aria-label="Diagram of the Lingkhor kora circuit, walked clockwise from the Tsuglagkhang temple entrance, passing Tarani Mata Mandir, the forest path, and Kora House on Buddha House Road, before closing back at the temple.">
        {/* Faint full circuit, so the shape reads as a closed loop before the
            draw reaches the end. */}
        <path d={KORA_PATH_D} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" />

        {/* The drawn line */}
        <path
          ref={pathRef}
          className="kora-line"
          d={KORA_PATH_D}
          pathLength="1"
          fill="none"
          stroke="var(--color-maroon)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Clockwise mark at the centre. The direction is doctrinal. */}
        <g className="kora-wp" style={{ "--wp-a": "34%", "--wp-b": "44%" } as React.CSSProperties}>
          <path
            d="M 276,236 a 24,24 0 1 1 -0.4,3"
            fill="none"
            stroke="var(--color-butter)"
            strokeWidth="1.2"
          />
          <path d="M 273,226 l 4,10 -10.5,1.5 z" fill="var(--color-butter)" />
          <text
            x={CENTER.x}
            y={CENTER.y + 48}
            textAnchor="middle"
            fontSize="11"
            letterSpacing="0.22em"
            fill="currentColor"
            opacity="0.5"
            className="font-data"
          >
            CLOCKWISE
          </text>
        </g>

        {koraWaypoints.map((w, i) => {
          const p = placed[i];
          if (!p) return null;
          // Each waypoint reveals as the line reaches it.
          const start = `${Math.round(28 + w.at * 42)}%`;
          const end = `${Math.round(34 + w.at * 42)}%`;
          const delay = `${Math.round(w.at * 1900)}ms`;
          return (
            <g
              key={w.name}
              className="kora-wp"
              style={
                {
                  "--wp-a": start,
                  "--wp-b": end,
                  "--wp-delay": delay,
                } as React.CSSProperties
              }
            >
              {w.isHouse ? (
                <>
                  {/* The climax of the sequence. */}
                  <circle cx={p.x} cy={p.y} r={11} fill="none" stroke="var(--color-maroon)" strokeWidth="1.2" />
                  <circle cx={p.x} cy={p.y} r={5.5} fill="var(--color-maroon)" />
                  <circle cx={p.x} cy={p.y} r={1.8} fill="var(--color-butter)" />
                </>
              ) : (
                <circle cx={p.x} cy={p.y} r={4} fill="var(--color-maroon)" opacity="0.85" />
              )}

              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={p.anchor}
                fontSize={w.isHouse ? 14 : 12.5}
                fill="currentColor"
                className={w.isHouse ? "font-display" : "font-data"}
              >
                {w.isHouse ? "Kora House" : w.name}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 15}
                textAnchor={p.anchor}
                fontSize="10.5"
                fill="currentColor"
                opacity="0.45"
                className="font-data"
              >
                {w.minutes}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
