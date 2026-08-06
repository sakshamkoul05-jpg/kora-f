"use client";

import { useEffect, useRef, useState } from "react";

const MARKERS = [
  { at: 0.04, label: "Kora House" },
  { at: 0.3, label: "Tsuglagkhang Temple" },
  { at: 0.55, label: "Lhagyal Ri kora" },
  { at: 0.78, label: "Dharamkot" },
  { at: 0.97, label: "Back to the house" },
] as const;

// Stylised clockwise loop around the hill — top, right, bottom, left, top.
const PATH_D =
  "M 260,40 C 380,40 460,110 460,220 C 460,330 380,400 260,400 C 140,400 60,330 60,220 C 60,110 140,40 260,40 Z";

export function KoraPathDraw() {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [length, setLength] = useState(0);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawn, setDrawn] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const path = pathRef.current;
    if (path) {
      const total = path.getTotalLength();
      setLength(total);
      setPoints(MARKERS.map((m) => path.getPointAtLength(total * m.at)));
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
    <div ref={containerRef} className="relative mx-auto max-w-lg">
      <svg viewBox="0 0 520 440" className="w-full text-ink">
        <path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={
            reduced || !length
              ? undefined
              : {
                  strokeDasharray: length,
                  strokeDashoffset: active ? 0 : length,
                  transition: "stroke-dashoffset 2.2s ease-in-out",
                }
          }
        />
        {MARKERS.map((m, i) => {
          const point = points[i];
          if (!point) return null;
          return (
            <g
              key={m.label}
              style={{
                opacity: active ? 1 : 0,
                transition: reduced ? undefined : `opacity 350ms ease-out ${0.25 + i * 0.35}s`,
              }}
            >
              <circle cx={point.x} cy={point.y} r={4} fill="var(--color-maroon)" />
              <text
                x={point.x + 9}
                y={point.y + 4}
                fontSize="11"
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
