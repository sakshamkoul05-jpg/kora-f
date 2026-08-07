# Motion — Kora House

Six signature interactions, each derived from an object or practice in the
Tibetan tradition around this property, and each doing a real interface job.
Anything that stopped navigating, indicating state, or revealing content would
be decoration and should be cut.

Review them in isolation at **`/motion`** (not linked in navigation, `noindex`).

---

## Rules that must not be broken

These are correctness constraints, not preferences. Each one is a thing the
real object does, or does not do.

| # | Rule | Why |
|---|------|-----|
| 1 | **The guru bead is never crossed.** The mala rail must never wrap from the last section to the first. On reaching the end it pauses, then *reverses*. | A mala is counted up to the guru bead and the strand is then turned around. Wrapping is the one thing the object specifically does not do. Enforced by `lib/mala-state.ts` and asserted in `lib/mala-state.test.ts`. |
| 2 | **The kora is walked clockwise.** The circuit draws clockwise; the prayer wheel spins clockwise only and resists anticlockwise drag. | Doctrinal direction. Getting it backwards is an error, not a style choice. |
| 3 | **Prayer flag colour order is blue, white, red, green, yellow.** Never reshuffled for visual balance. | Fixed traditional order (sky, air, fire, water, earth). |
| 4 | **The Namchu Wangden monogram is never animated.** Not a loader, spinner, background pattern or hover effect. Placed once, static, on booking confirmation. | See "Kalachakra" below. |
| 5 | **No motion in the booking flow past step one, and none in the admin.** | Someone entering payment details wants stillness. |
| 6 | **Everything degrades completely under `prefers-reduced-motion: reduce`** — static, functional, no movement. | The mala still shows position; it just doesn't travel. |

---

## 1. Mala rail — primary scroll navigation

`components/motion/MalaRail.tsx` · logic in `lib/mala-state.ts`

**Derived from:** the 108-bead mala, with counter beads at 27/54/81 and a
larger guru bead terminating the strand.

**Interface job:** primary section navigation. Each bead is a real `<button>`
inside a `<nav aria-label="Page sections">` landmark; the active bead carries
`aria-current="location"`; each bead's label is its accessible name and appears
visually on hover/focus. The guru bead returns to the top.

**Mechanics**

- Counter beads sit at the **quarter positions** (25/50/75%), mirroring
  27/54/81 of 108. The original build spec said "every fourth bead" — that was
  an error and is superseded.
- Bead radii carry a small deterministic wobble seeded from the index, so they
  read as bodhi seed rather than identical glossy circles. Matte fills only.
- The settle is a **damped overshoot**: the bead is drawn toward the reader,
  overshoots once, undershoots slightly, and stops — inside 420ms. Deliberately
  not a spring (springs oscillate repeatedly and read as toy-like) and not a
  linear slide.
- **The guru bead reversal.** On reaching the last section the rail sets
  `turning`, holds 600ms while the guru bead acknowledges, then flips `pass` to
  `"return"`. Travel then runs back the other way and the settle animation
  visibly reverses direction. Returning to the origin begins a fresh circuit.
  The index is **never** taken modulo the section count.

**Position tracking** is IntersectionObserver, never a scroll listener.

**Reduced motion:** beads render, the current one is marked, no travel
animation, and in-page scrolling uses `behavior: "auto"`.

> The traversal rule is extracted as a pure state machine specifically so it
> can be tested. `npm test` asserts, among other things, that the strand never
> steps from the last bead to the first in either direction. If you change the
> rail, keep the rules in `mala-state.ts` and keep that test passing.

---

## 3. Kora circuit — the spine of the Experiences page

`components/motion/KoraCircuit.tsx` · data in `lib/kora-route.ts`

**Derived from:** the Lingkhor circuit around the Tsuglagkhang complex.

**Interface job:** it *is* the content — the route, its waypoints and the
walking times, revealed in the order you actually walk them.

**Waypoints, in real order, clockwise:** Tsuglagkhang main entrance → Tarani
Mata Mandir → forest path → Lhagyal Ri / Buddha House Road (**Kora House**) →
return to the temple entrance. The path closes into a complete circle: unlike
the mala, this loop *should* close.

**The house marker** is the climax — the largest marker, and positioned at
`at: 0.57`, which is where this path reaches bottom-centre. Measured: 5.7px off
the loop's centre on a ~420px loop, sitting exactly at its lowest point. **If
`KORA_PATH_D` changes, re-measure and re-tune that value.**

**Drive mechanism**, in preference order:

1. `animation-timeline: view()` — scrubbed by scroll position, off the main
   thread. `pathLength="1"` on the path normalises the geometry so the dash
   maths is simply 1 → 0 and needs no JS measurement at all.
2. An IntersectionObserver fallback that plays it once on entry.

Never a scroll event listener.

**Documented exception to "transform and opacity only":** this component
animates `stroke-dashoffset`. Both the build spec and the interaction brief
name `stroke-dasharray` explicitly for the kora path. It repaints one thin path
on its own layer and does not trigger layout. This is the only place it is
allowed.

**Reduced motion needs an explicit override here.** The global reduced-motion
block clamps `animation-duration`, which does *nothing* to a scroll-driven
animation — those are driven by the timeline, not by time. Without the explicit
rule in `globals.css` the line would still draw itself. The resting state is
the finished diagram: fully drawn, every label legible.

**Copy discipline:** the page states plainly that the house sits on the route.
Annotations are observations — 20–30 minutes, mostly shaded, prayer wheels
along the wall, mani stones, langurs in winter, good for birds. It is not sold
as a spiritual amenity. The restraint is the point.

> `TODO_CONFIRM`: per-waypoint cumulative minutes are an even distribution
> across the stated 20–30 minute total, not measured splits. Confirm with the
> hosts or drop the per-waypoint figures and show only the total.

---

## 2. Prayer wheel — not yet built

Real angular momentum: velocity integrated in `requestAnimationFrame` with a
friction coefficient, drag imparting velocity proportional to gesture speed,
coasting several seconds from a firm spin. Rendered as a **drum with visible
vertical faces**, not a flat disc. **Clockwise only** — anticlockwise drag
resists and returns. The rAF loop must stop entirely at rest; no idle spin.
Spinning it reveals the kora section, so it earns its place.

## 5. Prayer flags — in place, pending rework to this brief

`components/PrayerFlags.tsx` currently hangs 16 flags from a sagging bezier,
each rotated to the local tangent, sun-bleached and irregular. Still to do
against this brief: drive gust amplitude from a **looping noise value** rather
than fixed periods, and decay to complete stillness after ~8s, resuming briefly
on scroll.

Colour order is fixed: **blue, white, red, green, yellow**. Do not reshuffle.

## 6. Butter lamp — in place, pending rework to this brief

Warm irregular glow on primary maroon CTAs, currently layered offset pulses
rather than a smooth sine. Still to do: drive it from the shared noise value.
If it is noticeable at a glance, halve it.

## 4. Mani stones — not yet built

Section markers along the kora rendered as carved stones. On hover/focus the
carving catches light: **move an SVG lighting filter's light source a few
degrees — the stone itself does not move or scale.**

If the mantra is inscribed it must be correct Tibetan Uchen script in Noto
Serif Tibetan, legibly sized and correctly spelled. **If that cannot be done
properly, leave the stones uncarved.** A plain stone is honest; a garbled one
is not.

---

## Kalachakra — Namchu Wangden

Do **not** animate the monogram, and do not use it as a loader, spinner,
background pattern, or hover effect.

It is placed once, static, on the booking confirmation screen, as a threshold
mark above the confirmation card — the way it appears above a doorway.

The artwork is to be **commissioned from a Tibetan artist or sourced from
Norbulingka Institute**. It must not be generated, traced, or approximated in
code. The implementation should carry a `TODO_ARTWORK` placeholder at the
correct aspect ratio until real artwork exists.

---

## Shared infrastructure

- **`lib/useReducedMotion.ts`** — the single hook, used by all interactions.
  `useSyncExternalStore`, so there is no hydration mismatch and no
  setState-in-effect, and it stays live if the OS setting changes mid-session.
- **`lib/deterministic.ts`** — SSR-safe pseudo-randomness. Integer-only hash,
  plus `round3` for anything reaching the DOM. **`Math.sin`/`Math.atan2` are
  implementation-defined to the last ULP** and have already caused a real
  hydration mismatch in this codebase; avoiding `Math.random` alone is not
  sufficient.
- **`app/motion`** — the review route.

## Budget

Target 20KB gzipped for added JS. Interactions 1 and 3, measured with esbuild
(minified, gzipped, React/Next external, shared modules deduped):

| module | min (B) | min+gzip (B) |
|---|---:|---:|
| MalaRail (interaction 1) | 3298 | 1599 |
| KoraCircuit (interaction 3) | 3261 | 1528 |
| useReducedMotion (shared hook) | 324 | 225 |
| mala-state (tested state machine) | 424 | 238 |
| deterministic (shared helpers) | 351 | 234 |
| kora-route (data + copy) | 811 | 492 |
| **combined, deduped, as shipped** | **6532** | **2908** |

**2908 B of 20480 B — 14.2% used, 17572 B headroom** for interactions 2, 5, 6
and 4. Re-run the measurement as each lands.

## Testing

```bash
npm test          # the guru bead invariant and the rail traversal rules
npm run lint
npm run build
```

Performance target is 60fps on a mid-range Android over 4G; profile with CPU
throttling at 4x. The kora draw runs on the compositor where
`animation-timeline: view()` is supported, and the mala animates `transform`
only, so both should hold — but this has **not** yet been measured on device.
