"use client";

import { useEffect, useRef } from "react";

const FLAG_COLORS = ["#6e2230", "#e9ecea", "#e8b04b", "#3e5648", "#1e2a2e"];

// Wind-sway on the hero's prayer flags. Stops after a few seconds of no
// interaction so the page doesn't move forever. Driven imperatively via
// classList rather than React state, since this never affects what's
// rendered — only whether the CSS sway animation is running.
export function PrayerFlags() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const flags = Array.from(container.children) as HTMLElement[];
    const setSwaying = (on: boolean) => {
      flags.forEach((el, i) => {
        el.classList.toggle(i % 2 === 0 ? "flag-sway-a" : "flag-sway-b", on);
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
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-x-0 top-0 z-10 flex h-16 justify-center gap-1.5 overflow-hidden pt-1"
    >
      {FLAG_COLORS.concat(FLAG_COLORS).map((color, i) => (
        <span
          key={i}
          style={{
            display: "block",
            width: "1.75rem",
            height: "3.25rem",
            backgroundColor: color,
            animationDelay: `${i * 160}ms`,
            transformOrigin: "top center",
          }}
        />
      ))}
    </div>
  );
}
