"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { jitterRange, round3 } from "@/lib/deterministic";
import { MANTRA_TRANSLITERATION, OM_MANI_PADME_HUM, ensureTibetan } from "@/lib/mantra";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Mani stone — a waypoint marker on the kora, carved with om mani padme hum.
 *
 * The interaction is depth, not motion: on hover or focus the carving catches
 * the light. The STONE DOES NOT MOVE OR SCALE — what changes is the azimuth of
 * the lighting filter's light source, and, with it, which lip of the engraved
 * groove is lit. Moving the stone would read as a UI card; moving the light
 * reads as stone.
 *
 * The mantra is real Uchen (see lib/mantra.ts for the audited codepoints) set
 * in Noto Serif Tibetan. It is drawn ONLY once the font has actually loaded and
 * reports that it can render the string — see `isTibetanReady`. If it cannot,
 * the stone stays plain. Unshaped Tibetan is meaningless to anyone who reads
 * it, so a blank stone is the correct failure, never tofu.
 */

const BASE_AZIMUTH = 214;
const LIT_AZIMUTH = 234; // twenty degrees; the light moves, the stone does not
const TWEEN_MS = 280;
const GROOVE_DEPTH = 1.05; // px offset of the lit lip from the groove

export function ManiStone({
  index,
  name,
  meta,
  note,
}: {
  index: number;
  name: string;
  meta: string;
  note?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const lightRef = useRef<SVGFEDistantLightElement>(null);
  const lipRef = useRef<SVGTextElement>(null);
  const raf = useRef<number | null>(null);
  const current = useRef(BASE_AZIMUTH);
  const [open, setOpen] = useState(false);
  const [carved, setCarved] = useState(false);
  const reduced = useReducedMotion();

  // Only carve once the Tibetan face is genuinely available. `ensureTibetan`
  // requests the face first — checking without asking would deadlock, because
  // nothing else on the page draws Uchen.
  useEffect(() => {
    let cancelled = false;
    ensureTibetan().then((ok) => {
      if (!cancelled && ok) setCarved(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Light direction drives both the filter and which lip of the groove is lit. */
  const applyAzimuth = useCallback((az: number) => {
    current.current = az;
    lightRef.current?.setAttribute("azimuth", az.toFixed(1));
    // The lit lip sits on the far side of the groove from the light.
    const rad = ((az + 180) * Math.PI) / 180;
    const dx = Math.cos(rad) * GROOVE_DEPTH;
    const dy = -Math.sin(rad) * GROOVE_DEPTH;
    lipRef.current?.setAttribute("transform", `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
  }, []);

  const tweenTo = useCallback(
    (target: number) => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      if (reduced) {
        applyAzimuth(target); // instant state change, no motion
        return;
      }
      const from = current.current;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - t0) / TWEEN_MS, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        applyAzimuth(from + (target - from) * eased);
        if (p < 1) {
          raf.current = requestAnimationFrame(step);
        } else {
          raf.current = null; // the light has arrived; stop the loop
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [reduced, applyAzimuth]
  );

  useEffect(() => {
    applyAzimuth(BASE_AZIMUTH);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [applyAzimuth]);

  // Deterministic irregular outline — no two stones off the same hillside match.
  const w = 172;
  const h = 112;
  const j = (s: number, a: number, b: number) => round3(jitterRange(index, s, a, b));
  const outline = `M ${j(1, 8, 15)},${j(2, 48, 58)}
    C ${j(3, 3, 10)},${j(4, 22, 30)} ${j(5, 32, 44)},${j(6, 5, 11)} ${j(7, 74, 86)},${j(8, 6, 12)}
    C ${j(9, 118, 130)},${j(10, 4, 11)} ${j(11, 156, 166)},${j(12, 24, 32)} ${j(13, 160, 168)},${j(14, 54, 62)}
    C ${j(15, 163, 170)},${j(16, 82, 92)} ${j(17, 122, 134)},${j(18, 100, 107)} ${j(19, 76, 88)},${j(20, 101, 107)}
    C ${j(21, 40, 52)},${j(22, 102, 108)} ${j(23, 6, 14)},${j(24, 80, 92)} ${j(25, 8, 15)},${j(26, 48, 58)} Z`;

  const mantraY = h / 2 + 7;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onMouseEnter={() => tweenTo(LIT_AZIMUTH)}
        onMouseLeave={() => tweenTo(BASE_AZIMUTH)}
        onFocus={() => tweenTo(LIT_AZIMUTH)}
        onBlur={() => tweenTo(BASE_AZIMUTH)}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={note ? open : undefined}
        className="mani-stone group relative block w-full rounded-[var(--radius-kora)] text-left"
      >
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden>
          <defs>
            <filter id={`stone-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.05"
                numOctaves="3"
                seed={index + 4}
                result="grain"
              />
              <feDiffuseLighting
                in="grain"
                lightingColor="#cdbfa6"
                surfaceScale="2.4"
                diffuseConstant="1.05"
                result="lit"
              >
                <feDistantLight ref={lightRef} azimuth={BASE_AZIMUTH} elevation="55" />
              </feDiffuseLighting>
              <feComposite in="lit" in2="SourceGraphic" operator="in" />
            </filter>

            {/* Clip so the carving can never spill off the edge of the stone. */}
            <clipPath id={`clip-${uid}`}>
              <path d={outline} />
            </clipPath>
          </defs>

          <path d={outline} fill="#8d8272" filter={`url(#stone-${uid})`} />

          {carved && (
            <g clipPath={`url(#clip-${uid})`}>
              {/* The lit lower lip of the groove. Sits opposite the light, and
                  moves with it — this is what makes the carving "catch". */}
              <text
                ref={lipRef}
                x={w / 2}
                y={mantraY}
                textAnchor="middle"
                className="mani-mantra"
                fill="#e2d7c0"
                opacity="0.62"
              >
                {OM_MANI_PADME_HUM}
              </text>
              {/* The groove itself: recessed, so darker than the stone. */}
              <text
                x={w / 2}
                y={mantraY}
                textAnchor="middle"
                className="mani-mantra"
                fill="#332c22"
                opacity="0.9"
              >
                {OM_MANI_PADME_HUM}
              </text>
            </g>
          )}
        </svg>

        <span className="mt-3 block font-display text-[17px] leading-tight">{name}</span>
        <span className="mt-1 block font-data text-[11px] text-ink/45">{meta}</span>
      </button>

      {/* The mantra is decorative-by-repetition on the stone itself (aria-hidden
          SVG); it is named once here for screen readers, transliterated. */}
      {carved && <span className="sr-only">Carved with the mantra {MANTRA_TRANSLITERATION}</span>}

      {note && open && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{note}</p>}
    </div>
  );
}
