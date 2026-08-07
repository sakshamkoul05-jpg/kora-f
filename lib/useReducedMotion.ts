"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

// The server can't know the user's preference. Reporting `false` here and
// letting the client correct on hydration is safe *because* the CSS
// reduced-motion block in globals.css already neutralises every animation
// independently — JS never has to win the race to prevent movement.
const getServerSnapshot = () => false;

/**
 * The single source of truth for motion preference across all six
 * interactions. `useSyncExternalStore` rather than useState+useEffect: it
 * avoids both the setState-in-effect lint rule and a hydration mismatch,
 * and it stays in sync if the user changes the OS setting mid-session.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
