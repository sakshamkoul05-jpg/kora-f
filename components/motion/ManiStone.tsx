"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { jitterRange, round3 } from "@/lib/deterministic";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Mani stone — a waypoint marker on the kora.
 *
 * The interaction is depth, not motion: on hover or focus the carving catches
 * the light. The STONE DOES NOT MOVE OR SCALE — what changes is the azimuth of
 * the SVG lighting filter's light source, by twenty degrees. Moving the stone
 * would read as a UI card; moving the light reads as stone.
 *
 * ── On the mantra ──────────────────────────────────────────────────────────
 * These stones are deliberately UNCARVED of script.
 *
 * The brief's standard is that if the mantra is inscribed it must be correct
 * Tibetan Uchen, properly shaped, correctly spelled — and that if that cannot
 * be done properly the stones should be left plain, because a plain stone is
 * honest and a garbled one is not.
 *
 * Om mani padme hum requires stacked subjoined consonants (the ෆ of པདྨེ, the
 * vowel+nasal cluster of ཧཱུྃ). Those are exactly the sequences that render as
 * tofu or mis-stacked glyphs when font loading or shaping fails, and that
 * failure is invisible to anyone who does not read Tibetan. It could not be
 * visually verified in this environment, so it is not shipped.
 *
 * The correct sequence, for whoever enables this after checking it renders
 * with a native reader present:
 *   ཨོཾ་མ་ཎི་པདྨེ་ཧཱུྃ
 *   U+0F68 U+0F7C U+0F7E · U+0F0B · U+0F58 · U+0F0B · U+0F4E U+0F72 · U+0F0B ·
 *   U+0F54 U+0F51 U+0FA8 U+0F7A · U+0F0B · U+0F67 U+0F71 U+0F74 U+0F83
 * with Noto Serif Tibetan actually loaded and a fallback check in place.
 *
 * The incisions below are plain tool marks — deliberately not letterforms, so
 * nothing can be mistaken for badly-set script.
 */

const BASE_AZIMUTH = 214;
const LIT_AZIMUTH = 234; // twenty degrees; the light moves, the stone does not
const TWEEN_MS = 280;

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
  const raf = useRef<number | null>(null);
  const current = useRef(BASE_AZIMUTH);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  const setAzimuth = useCallback((v: number) => {
    current.current = v;
    lightRef.current?.setAttribute("azimuth", v.toFixed(1));
  }, []);

  const tweenTo = useCallback(
    (target: number) => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      if (reduced) {
        // Instant state change, no motion — the reduced-motion contract.
        setAzimuth(target);
        return;
      }
      const from = current.current;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - t0) / TWEEN_MS, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setAzimuth(from + (target - from) * eased);
        if (p < 1) {
          raf.current = requestAnimationFrame(step);
        } else {
          raf.current = null; // stop the loop; the light has arrived
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [reduced, setAzimuth]
  );

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    []
  );

  // Deterministic irregular outline — no two stones off the same hillside match.
  const w = 168;
  const h = 104;
  const j = (s: number, a: number, b: number) => round3(jitterRange(index, s, a, b));
  const outline = `M ${j(1, 10, 18)},${j(2, 44, 54)}
    C ${j(3, 4, 12)},${j(4, 20, 28)} ${j(5, 34, 46)},${j(6, 6, 12)} ${j(7, 74, 86)},${j(8, 7, 13)}
    C ${j(9, 116, 128)},${j(10, 5, 12)} ${j(11, 150, 160)},${j(12, 22, 30)} ${j(13, 154, 162)},${j(14, 50, 58)}
    C ${j(15, 158, 166)},${j(16, 76, 86)} ${j(17, 120, 132)},${j(18, 92, 99)} ${j(19, 76, 88)},${j(20, 93, 99)}
    C ${j(21, 40, 52)},${j(22, 94, 100)} ${j(23, 8, 16)},${j(24, 74, 84)} ${j(25, 10, 18)},${j(26, 44, 54)} Z`;

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
                baseFrequency="0.045"
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
          </defs>

          <path d={outline} fill="#8d8272" filter={`url(#stone-${uid})`} />
          {/* Plain incised tool marks. Deliberately not letterforms. */}
          <g
            stroke="rgba(28,20,14,0.34)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          >
            <path d={`M ${j(27, 34, 40)},${j(28, 40, 46)} h ${j(29, 78, 94)}`} />
            <path d={`M ${j(30, 34, 40)},${j(31, 54, 60)} h ${j(32, 56, 74)}`} />
            <path d={`M ${j(33, 34, 40)},${j(34, 68, 74)} h ${j(35, 66, 84)}`} />
          </g>
        </svg>

        <span className="mt-3 block font-display text-[17px] leading-tight">{name}</span>
        <span className="mt-1 block font-data text-[11px] text-ink/45">{meta}</span>
      </button>

      {note && open && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{note}</p>}
    </div>
  );
}
