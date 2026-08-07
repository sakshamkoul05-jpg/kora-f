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

## 2. Prayer wheel — entry point to the route

`components/motion/PrayerWheel.tsx` · physics in `lib/wheel-physics.ts`

**Derived from:** the mani chos 'khor, the hand-turned prayer drum.

**Interface job:** it is the way into the kora route. Spinning it reveals the
circuit.

**Rendered as a drum, not a disc.** 24 vertical faces on a
`transform-style: preserve-3d` cylinder. A flat spinning circle is the tell of
a wheel nobody looked at. Because it is a real cylinder the physics loop writes
exactly **one** transform per frame — on the parent — instead of restyling
every face, so it composites cheaply. The lighting is a static overlay that
does *not* rotate: the light stays in the room and the faces turn through it.

**Physics.** Angular velocity integrated in `requestAnimationFrame` under
exponential friction. Drag imparts velocity proportional to gesture speed,
sampled over the last ~90ms. Tested: a firm spin (900°/s) coasts **4.7s**, and
the drum genuinely reaches rest from maximum velocity rather than decaying
asymptotically forever — which is what lets the loop stop.

**The loop stops dead at rest.** No idle spin, ever.

**CLOCKWISE ONLY.** `clampSpin` never returns a negative velocity, so no
gesture can make the drum turn backwards. Dragging anticlockwise of where the
gesture began is damped to 22% and springs back on release — sprung, not stuck.
Unit tested.

**Keyboard:** Enter, Space, → or ↑ spin it. ← and ↓ are deliberately inert.

**Reduced motion:** the drum does not spin, and the route is revealed from the
start rather than gated.

> The route is **never trapped behind the gesture**. The content is always in
> the DOM, the reveal is opacity and transform only, there is a plain "Or show
> the route" control, and reduced motion opens it immediately. Gating content
> behind a drag with no way past it would be a trap, not an interaction.

## 5. Prayer flags — wind that dies down

`components/motion/PrayerFlags.tsx`

**Derived from:** lungta strung between rooftops.

Sixteen flags hang from a **sagging** quadratic bezier — the line is never
horizontal — each rotated to the local tangent, with irregular widths, drooping
hems and sun-bleached translucency.

**Gusts come from a looping noise value**, one generator per flag with its own
seed and period, so they never fall into visible sync. Wind is gusty, not
periodic: a sine reads as machinery because the eye catches the period.

**It dies down.** An eased envelope decays the amplitude to zero over ~8s
without interaction, and then the rAF loop **stops entirely** — a still page
costs nothing. Scrolling wakes it briefly. A permanently fluttering page reads
as a screensaver.

**COLOUR ORDER IS FIXED: blue, white, red, green, yellow** — sky, air, fire,
water, earth. Never reshuffled for visual balance.

## 6. Butter lamp — CTA hover

`components/motion/useButterLamp.ts`

Warm irregular glow on primary maroon CTAs, driven by **noise, not a smooth
pulse** — flame flicker is not a sine wave.

Only **opacity** is animated. The glow itself is a static `box-shadow` painted
once on a child span, so the per-frame work stays on the compositor and the
button is never repainted. Amplitude is 0.26–0.46 opacity. It is meant to be
barely perceptible: **if you notice it at a glance, halve it.**

The loop runs only while hovered or focused. Reduced motion gets a constant
value — an instant state change, no flicker.

## 4. Mani stones — depth, not motion

`components/motion/ManiStone.tsx`

Waypoint markers on the kora, rendered as stones with a deterministic irregular
outline — no two off the same hillside match.

**On hover or focus the light moves, not the stone.** The azimuth of the
lighting filter's `feDistantLight` shifts twenty degrees over 280ms. Verified:
the stone's own computed transform is `none` in every state. Moving or scaling
it would read as a UI card; moving the light reads as stone.

Each stone is a real `<button>` — clicking opens its note — and each gets a
unique filter id via `useId`.

### The stones are deliberately UNCARVED

The standard is correct Uchen or nothing. *Om mani padme hum* requires stacked
subjoined consonants (the ྨ of པདྨེ, the vowel-plus-nasal cluster of ཧཱུྃ) —
exactly the sequences that render as tofu or mis-stacked glyphs when font
loading or shaping fails. **That failure is invisible to anyone who does not
read Tibetan**, and it could not be visually verified in the build environment,
so it is not shipped. The incisions on the stones are plain tool marks,
deliberately not letterforms, so nothing can be mistaken for badly-set script.

The correct sequence is recorded in the component's header comment for whoever
enables this **after checking it renders with a native reader present**.

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

Target 20KB gzipped for added JS. Measured with esbuild (minified, gzipped,
React/Next external, shared modules deduped):

| module | min (B) | min+gzip (B) |
|---|---:|---:|
| 1 · MalaRail | 3298 | 1599 |
| 2 · PrayerWheel | 3762 | 1715 |
| 3 · KoraCircuit | 3261 | 1528 |
| 4 · ManiStone | 3226 | 1668 |
| 5 · PrayerFlags | 3108 | 1670 |
| 6 · useButterLamp | 1371 | 775 |
| — NamchuWangden (static) | 667 | 451 |
| shared · useReducedMotion | 324 | 225 |
| shared · noise | 440 | 307 |
| shared · deterministic | 351 | 234 |
| shared · mala-state | 424 | 238 |
| shared · wheel-physics | 346 | 261 |
| data · kora-route | 811 | 492 |
| **all six, deduped, as shipped** | **17189** | **7187** |

**7187 B of 20480 B — 35.1% used, 13293 B headroom.** No GSAP, no Three.js, no
Lottie; the only added dependency is nothing at all.

## Testing

```bash
npm test          # 16 tests: guru bead invariant, wheel physics, noise
npm run lint
npm run build
```

Behavioural rules are extracted into pure modules (`mala-state`,
`wheel-physics`, `noise`) specifically so they can be tested rather than
eyeballed. Among the assertions:

- the mala strand never steps last→first in either direction (the guru bead)
- `clampSpin` never returns a negative velocity (clockwise only)
- a firm spin coasts 4.7s, and the drum truly reaches rest so the loop can stop
- the noise loops, stays continuous frame to frame, and has irregular peak
  heights — i.e. it is demonstrably not a sine

### What has NOT been verified

Be honest about this when reviewing:

- **Runtime motion has not been observed.** The build environment's browser
  pane reports `document.visibilityState === "hidden"`, so
  `requestAnimationFrame` never fires and IntersectionObserver never delivers
  (measured: 0 frames in 500ms). Events *are* delivered, so the wiring is
  sound, but no animation has actually been watched. Everything above is
  verified by unit test, computed style, or DOM structure — not by eye.
  **Open `/motion` and look at it.**
- **The 60fps target on a mid-range Android over 4G has not been measured.**
  Profile with CPU throttling at 4x. The likely hot spot is interaction 4: the
  `feTurbulence` + `feDiffuseLighting` filter re-renders while the azimuth
  tweens. It is bounded to 280ms on one stone at a time, but it is the first
  thing to check on device, and the first thing to cut if it does not hold.
