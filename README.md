# Kora House — website

Marketing site for Kora House, a six-room hilltop guesthouse in McLeodganj,
Himachal Pradesh. Built against `../kora-house-build-spec.md`, using the
Stitch designs in `../kora-house-stitch-prompts.md` as layout reference only
(the build spec's facts win where the two disagree).

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4. No
database, auth, or payments yet — see "Where this stopped" below.

## Getting started

```bash
npm run dev
```

Open http://localhost:3000.

## Build order status

Per the spec's step 5 ("Stop. Review with the hosts before anything below
this line."), this build covers **steps 1–4 only**:

1. ✅ Design tokens, typography, grain treatment, base layout, header and footer
2. ✅ Homepage — including the balcony section and the mala scroll indicator
3. ✅ Rooms index with kitchen/floor filters, and room detail
4. ✅ The House, Experiences (with the kora path animation), Getting Here, FAQ

**Not started:** the booking flow, Razorpay, Auth.js, guest accounts, or the
admin CRM (spec steps 6–7). "Check availability" / "Book" buttons currently
link to `/rooms` and the room detail page says booking is coming soon — there
is no live booking path yet, by design.

## TODO_CONFIRM — facts pending confirmation from the hosts

All of these live as `null` values or comments in `lib/site.ts` and
`lib/rooms.ts`, not invented numbers in the UI. Nothing below has been
guessed at; get these from Rohitash and Ashish before shipping:

- **Phone / WhatsApp number** (`lib/site.ts`) — currently carries the number
  from the brief, unconfirmed.
- **Host name spelling** for Rohitash and Ashish, and how each wants to be
  named on the site.
- **Caretaker name spelling** for Suraj.
- **Google review listing URL** (`site.googleReviewUrl`) — placeholder only,
  needed to link out to the real 4.7★ / 69-review listing.
- **Per-room data** for all six rooms (`lib/rooms.ts`): real names (currently
  "Room 1"–"Room 6" placeholders), occupancy, bed configuration, size in m²,
  and nightly rate. Do not invent these — ask.
- **Cancellation / booking policy** — not defined anywhere yet; the FAQ page
  says this is being finalised.

## Photography

Two different kinds of image on this site, handled two different ways:

**Location/culture photography (real, in place today).** Nine photos of
McLeodganj, Dharamshala and the surrounding area — hero, balcony-view stand-in,
monastery, prayer flags, Triund, Dharamkot, temple architecture, street,
Himalayas backdrop — sourced from Wikimedia Commons under free licences
(CC BY / CC BY-SA), credited in `lib/image-credits.ts` and on the public
`/credits` page, with a hover credit on each photo. These are real places
near the property, not the property itself.

**Property photography (still PHOTOS_PENDING).** Rooms, the actual balcony,
the dining area, exterior, and photos of the hosts are all still the warm
`PhotoPending` placeholder (`components/PhotoPending.tsx`) — not a flat grey
box, but not a real photo either. Do not source these from the Google
Business Profile, Google Maps, or the Places API — those are owner/guest-
uploaded and not licensed for reuse, and review text must never be copied
onto the site (link to the Google listing instead).

Ask Rohitash and Ashish directly for:

- Original files of the photos already on their Google profile
- The balcony at different times of day — sunrise is the single most
  valuable image for this site
- One clear photo of each of the six rooms
- Dining area, exterior approach, and a photo of the hosts

Once those arrive, swap them in via `next/image` (AVIF/WebP, blur
placeholders) in place of `PhotoPending` — see spec §7 for the size budget
(hero under 200KB). Never substitute a stock photo of an unrelated person
for a host or caretaker photo — the placeholder stays a placeholder until
the real one exists.

## Animation notes

Six pieces of animation from Tibetan material culture are implemented:
mala scroll indicator, prayer-wheel booking progress (component not yet
needed — no booking flow exists yet), kora path draw (Experiences page),
khata page-transition veil (root layout), butter-lamp CTA hover glow, and
prayer-flag hero sway. All respect `prefers-reduced-motion` — verified both
via the global CSS reduced-motion rule in `app/globals.css` and via explicit
`matchMedia` checks in each interactive component (`MalaIndicator`,
`PrayerFlags`, `KoraPathDraw`). None of it runs past booking step one or in
admin, because neither exists yet.

## Overhaul notes (third pass)

The client asked for a full overhaul: more genuinely Tibetan, more rustic,
still premium. Three concrete defects were called out and fixed:

- **Overlapping labels on the Experiences circle.** The diagram carried
  markers at t=0.04 and t=0.97 — 7% apart on a *closed* loop, so "Kora House"
  and "Back to the house" printed on top of each other — and every label used
  the default start-anchor, so left-side labels ran back across the ring.
  `KoraPathDraw` now pushes each label radially outward and anchors it by
  side (`end` on the left, `start` on the right, `middle` at top/bottom), and
  the redundant return marker is gone. Verified in-browser: 0 pairwise
  bounding-box intersections.
- **Cartoonish prayer flags.** Ten flat, fully-saturated rectangles in a
  straight row. `PrayerFlags` now hangs 16 flags from a sagging quadratic
  bezier (~58px of sag), each rotated to the local tangent (75°–106° spread),
  with irregular widths, drooping hems, a fold shadow, and sun-bleached
  translucency (opacity 0.53–0.77). Traditional blue/white/red/green/yellow
  order is preserved — that order is meaningful, not a palette choice.
- **Too flat / not rustic.** Deeper warm palette, real two-layer hand-made
  paper texture (`PaperTexture`: fine fibre + broad mottle + vignette),
  `.band-dark` for monastery-wall depth, `.photo-warm` to unify nine photos
  from nine cameras into one set, and a proper ornament vocabulary
  (`Ornament`: cloud scroll, lotus band, interlace) replacing the single
  generic squiggle.

> **On ornament choice:** the motifs are the *decorative* vocabulary from
> textile borders and painted woodwork — deliberately **not** the Eight
> Auspicious Symbols or the dharmachakra. A badly drawn sacred symbol is
> worse than no symbol, and these carry the same identity without that risk.

### SSR determinism warning

`PrayerFlags` generates geometry at module scope, which is server-rendered.
`Math.sin`, `Math.atan2` and friends are **implementation-defined to the last
ULP** — Node and browser V8 can disagree, which produced a real hydration
mismatch during this pass (`37.11221408841084` vs `37.11221408849815`). The
fix, and the rule for anything similar here: use an integer-only hash
(`Math.imul`/xor/shift) for jitter, and round every number that reaches the
DOM (`round3`). Avoiding `Math.random()` alone is *not* sufficient.

## Redesign notes (second pass)

The first pass (cool-bone "quiet monastery" palette, 2px architectural radii,
no real photography) was rejected by the client: not enough visible Tibetan
culture, not enough real place photography, and it read as too austere for a
"premium resort" booking site. This pass responds with:

- **Warm palette.** Ink and Mist shifted from cool slate/bone to warm
  espresso/parchment. Maroon, Butter Lamp gold and Deodar green — the
  Tibetan monastic colours — are unchanged, they weren't the problem.
- **Visible cultural motifs, not just animation.** A five-colour prayer-flag
  strip (`​.prayer-flag-strip`) in the header, and a cloud-scroll flourish
  divider (`TibetanDivider`) at section boundaries — literal, restrained,
  not a busy pattern.
- **Real photography** of McLeodganj and nearby places throughout (see
  "Photography" above), instead of flat grey blocks everywhere.
- **Softer card radii** (`--radius-card`, 16px) for photos and content
  cards, while small UI (buttons, pills) stays crisp (`--radius-kora`, 4px)
  — the "rustic but still premium" split.

## No "nine rooms"

The Stitch prompt pack was written against a fictional nine-room concept.
The property has six. Every page here uses `lib/rooms.ts` (six entries) as
the single source of truth — do not reintroduce "nine" anywhere.
