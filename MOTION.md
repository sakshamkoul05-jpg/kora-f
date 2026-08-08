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
| 2 | **The kora is walked clockwise** — currently. The circuit draws clockwise and the wheels turn clockwise only. **See the open question below before changing anything.** | Doctrinal direction. Getting it backwards is an error, not a style choice — which is exactly why the contradiction below has to be settled by a person. |
| 3 | **Prayer flag colour order is blue, white, red, green, yellow.** Never reshuffled for visual balance. | Fixed traditional order (sky, air, fire, water, earth). |
| 4 | **The Namchu Wangden monogram is never animated.** Not a loader, spinner, background pattern or hover effect. Placed once, static, on booking confirmation. | See "Kalachakra" below. |
| 5 | **No motion in the booking flow past step one, and none in the admin.** | Someone entering payment details wants stillness. |
| 6 | **Everything degrades completely under `prefers-reduced-motion: reduce`** — static, functional, no movement. | The mala still shows position; it just doesn't travel. |

---

## ⚠ Open question: which way does the kora go?

**The two client documents contradict each other.**

| source | says |
|---|---|
| `kora-house-build-spec.md` | **clockwise** — "this is the direction of the kora and getting it backwards is a real error, not a stylistic one" |
| The hosts' own local guidebook | "circumambulating (walking in a **counter-clockwise** direction) around the temple" |

The code currently implements **clockwise**, on three grounds: it is what the
build spec instructs, it is the near-universal documented direction for
Tibetan Buddhist kora (counter-clockwise circumambulation is characteristic of
Bön rather than Buddhist practice), and it is the safer default to sit on while
the question is open.

**But the guidebook is the hosts' own writing about their own doorstep, and
they may simply be describing what they see every morning.** That is not a
thing to overrule from a desk.

This is not cosmetic. It affects:

- the direction the kora circuit draws (`lib/kora-route.ts`, `KoraCircuit`)
- the direction the prayer wheels turn, and the anticlockwise resistance
  (`lib/wheel-physics.ts` — `clampSpin` is unit tested to never allow reverse)
- the "CLOCKWISE" label rendered in the centre of the circuit diagram
- copy on the Story page and the guidebook

**Do not flip half of it.** If the answer is counter-clockwise, invert the path
direction, the physics sign convention, the label, and the copy together, and
update the tests — they currently assert clockwise as an invariant.

Ask a host, or anyone who walks it.

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

## 2. Prayer wheels — a wall of brass drums

`components/motion/PrayerWheelRow.tsx` · physics in `lib/wheel-physics.ts`

**Derived from:** the mani chos 'khor set in rows along a kora wall — which is
how you actually meet them, five in a line, not one on a plinth.

**Interface job:** it is the way into the kora route. Spinning any drum reveals
the circuit.

**Modelled on the photograph of the actual object**, not on a generic gold
cylinder. That means: patinated **copper** body (not bright brass), olive-brass
**Greek key meander** bands top and bottom, copper **scrollwork** courses, a
**raised mantra register**, dark recessed rules between courses, an ornate
**domed lid** with a finial, a hanging ring and a foot. It is an old handled
object, so it is dark, not shiny.

### Why it is a scrolling skin, not a faceted cylinder

The first attempt built each drum from 20 flat faces in `preserve-3d`. That
cannot carry this object: the meander rings, the scrollwork and the mantra all
**break at every face seam**, and no face is remotely wide enough to hold a
legible character. Real wheels are chased with unbroken bands.

So the drum is a **clipped window onto a skin** that carries the register stack
twice over, translated horizontally — one rotation consumes exactly one tile,
so it loops seamlessly. Rotation is still `transform` only, so it stays on the
compositor, and the ornament runs continuously all the way round.

The cylinder comes from a **fixed shading overlay** — dark cheeks at both edges,
a specular band off-centre — which does *not* turn. The light stays in the room
and the metal moves through it. That, more than the colour, is what makes a
flat rectangle read as a round metal drum.

**Hover to turn.** Pointer-enter or focus eases the drum up to speed; leaving
lets it coast down under friction. There is no drag — the object is something
you brush past, not something you grab.

**Turning releases the mantra.** Syllables rise off the drum and fade
(`transform` and `opacity` only, removed from the DOM on `animationend`). That
is what the object is *for* — the wheel turns so the mantra goes out. Capped at
five in flight, and never under reduced motion.

**Physics.** Angular velocity integrated in `requestAnimationFrame`; friction
and the clockwise clamp come from the unit-tested `lib/wheel-physics.ts`.

**Each loop stops dead at rest.** No idle spin, ever.

**CLOCKWISE ONLY.** `clampSpin` never returns a negative velocity, so nothing
can make a drum turn backwards. Unit tested.

**Keyboard:** every drum is a focusable button. Tab to one and it turns; Enter
gives it a push.

**Reduced motion:** the drums do not turn, no mantra is emitted, and the route
is revealed from the start rather than gated.

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

### The carving

The stones are carved with **om mani padme hum** in Uchen, set in Noto Serif
Tibetan. The engraved groove is dark; a lit lip sits on the far side of it from
the light source and **moves as the azimuth changes**, so the carving catches
the light as you hover.

The codepoints live in `lib/mantra.ts`, written as escapes with a per-syllable
audit comment, so they can be checked without depending on what an editor
renders:

```
U+0F68 U+0F7C U+0F7E · U+0F0B · U+0F58 · U+0F0B · U+0F4E U+0F72 · U+0F0B ·
U+0F54 U+0F51 U+0FA8 U+0F7A · U+0F0B · U+0F67 U+0F71 U+0F74 U+0F83
```

**Shaping is verified, not assumed.** Two clusters carry the risk — པདྨེ, where
the subjoined ma must stack *under* the da, and ཧཱུྃ, where vowels stack under
and the nasal above. Both were measured in the browser:

| check | result |
|---|---|
| whole mantra, shaped | 100.6px |
| whole mantra, naive per-codepoint sum | 193.0px |
| པདྨེ vs པདེ | identical (25.62px) — subjoined ma adds no advance |
| ཧཱུྃ vs ཧ alone | identical (11.8px) — vowels and nasal stack |

If shaping had failed, combining marks would advance instead of stacking and
the string would approach the 193px sum. It doesn't.

**The guard stays.** `ensureTibetan()` requests the face, waits, then checks
`document.fonts.check` against the actual mantra string. Nothing draws Uchen
until that resolves true; if the face genuinely fails to load the stone stays
plain. Unshaped Tibetan is meaningless to anyone who reads it, and a blank
stone is the correct failure — never tofu.

> A trap worth knowing about: checking `document.fonts.check` *without* first
> calling `document.fonts.load` deadlocks. Browsers only fetch a face when
> something already needs it, so the face sits `unloaded` forever and the
> stones never carve. This bit during implementation.

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
| 2 · PrayerWheelRow | 5326 | 2308 |
| 3 · KoraCircuit | 3261 | 1528 |
| 4 · ManiStone | 3933 | 2005 |
| 5 · PrayerFlags | 3108 | 1670 |
| 6 · useButterLamp | 1371 | 775 |
| — NamchuWangden (static) | 667 | 451 |
| shared · useReducedMotion | 324 | 225 |
| shared · noise | 440 | 307 |
| shared · deterministic | 351 | 234 |
| shared · mala-state | 424 | 238 |
| shared · wheel-physics | 346 | 261 |
| shared · mantra | 459 | 325 |
| data · kora-route | 811 | 492 |
| **all six, deduped, as shipped** | **19261** | **7996** |

**7996 B of 20480 B — 39.0% used, 12484 B headroom.** No GSAP, no Three.js, no
Lottie; the only added dependency is nothing at all. The Noto Serif Tibetan
webfont is *not* counted here — it is a font payload, not JS, and it is loaded
only when a page actually carves the mantra.

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
  Profile with CPU throttling at 4x. Two suspects, in order:
  1. **Interaction 4** — the `feTurbulence` + `feDiffuseLighting` filter
     re-renders while the azimuth tweens. Bounded to 280ms on one stone, but
     SVG filters are the most expensive thing here.
  2. **Interaction 2** — five drums can be spinning at once after a sweep, so
     five rAF loops run concurrently. Each writes only one transform, so it
     should hold, but it is the worst case in the set. If it doesn't, cap the
     number of simultaneously spinning drums rather than removing the sweep.
- **The carved mantra has not been read by anyone who reads Tibetan.** Shaping
  is verified by measurement (see above), which proves the glyphs are stacking
  correctly — it does *not* prove the text is well-set or that the size and
  spacing look right to a native eye. Have someone check it before launch.
