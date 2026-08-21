"use client";

import { useEffect } from "react";
import { phaseForInstant } from "@/lib/daylight";

/**
 * Light that matches the hillside.
 *
 * The page is lit by the real time of day in McLeodganj, not the visitor's own
 * timezone. Someone browsing from London at midnight sees the house in morning
 * light, because that is what it is there. It says "this is a real place, and
 * it is a particular hour there now" better than any sentence could.
 *
 * Two constraints shaped this.
 *
 * SSR SAFETY. Every marketing page is statically generated, so the build-time
 * hour is meaningless and baking a phase into the HTML would be wrong the
 * moment it was cached. The phase is applied to <html> in an effect after
 * mount — never during render — so there is nothing for hydration to disagree
 * about. The un-lit server output is the daytime palette, which is also the
 * right fallback if JavaScript never runs at all.
 *
 * CONTRAST. The palette shifts in HUE and barely in lightness. A genuinely
 * dark night theme would mean re-checking every text colour on the site, and
 * the failure mode is one already hit once here: unreadable text that nobody
 * notices until a guest complains. Paper stays paper; only its temperature
 * moves, plus a wash at the very top of the page where no text sits.
 */
export function Daylight() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      root.dataset.daylight = phaseForInstant(new Date());
    };
    apply();

    // The hillside does not change quickly. Five minutes is ample to catch a
    // crossing, and costs nothing in between.
    const id = window.setInterval(apply, 5 * 60 * 1000);

    // A tab left open overnight should be right again when it comes back.
    const onVisible = () => {
      if (document.visibilityState === "visible") apply();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
