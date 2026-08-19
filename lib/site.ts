// Verified property facts — see kora-house-build-spec.md §2.
// Anything marked TODO_CONFIRM must be confirmed with the hosts before shipping.

export const site = {
  name: "Kora House",
  tagline: "Stay on the circle",
  footerTagline: "On the circle, McLeodganj.",
  address: {
    line1: "Buddha House Road",
    line2: "McLeod Ganj, Dharamshala",
    line3: "Himachal Pradesh 176219",
    note: "Past the Dalai Lama Security Quarters and Horizon Villa",
  },
  coordinates: { lat: 32.2292, lng: 76.3228 },
  // TODO_CONFIRM: confirm this number is current and correct before shipping.
  phone: "+91 94180 66891",
  whatsapp: "+91 94180 66891",
  email: "jaikaria@gmail.com",
  // TODO_CONFIRM: the Instagram handle. The link is hidden until this is real
  // rather than shipping a button that goes nowhere.
  instagram: null as string | null,
  // A Maps search by name and place is stable without a place_id, so the
  // address link and the reviews link both work today. Swap in the canonical
  // place_id URL when the hosts send it — it is more precise.
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Kora+House+Buddha+House+Road+McLeod+Ganj",
  googleReviewUrl:
    "https://www.google.com/maps/search/?api=1&query=Kora+House+Buddha+House+Road+McLeod+Ganj",
  rating: { value: 4.7, count: 69 },
  // Confirmed by the hosts' own guidebook: Rohitash and Ashish are brothers,
  // and these are their actual roles rather than a generic "Host" label.
  hosts: [
    { name: "Rohitash", role: "Construction and the house day to day" },
    { name: "Ashish", role: "Bookings and everything online" },
  ],
  caretaker: {
    // TODO_CONFIRM: confirm spelling.
    name: "Suraj",
    role: "Caretaker",
    onSiteHours: "9am–5pm",
    note: "Reachable by phone outside those hours",
  },
  // These are load-bearing. The build spec requires them present and findable
  // rather than buried — they prevent the mismatched-expectation review. Do
  // not soften them to fit a nicer sentence.
  //
  // The step count is the hosts' own figure and is far more use than "a
  // significant number of stairs" ever was: 61 is a number someone can weigh
  // against their own knees.
  caveats: {
    // TODO_CONFIRM the exact count. The hosts' written content said 61; their
    // feedback then said "I think there are 50, I can find out". A range is
    // used rather than false precision, because this is the fact a guest with
    // bad knees decides on. NOTE: there is NO step-free room — an earlier
    // version wrongly said the ground-floor room avoided the climb.
    stairs:
      "Roughly 50 to 60 steps from the car park up to the house, and no lift. Every room is above that climb, including the ground-floor one. The caretaker will carry your bags, but the steps themselves are unavoidable, so the house is not suited to guests with mobility difficulty.",
    market: "The market is about 500 metres away.",
    housekeeping: "Housekeeping is not daily.",
    sounds:
      "Street dogs bark at night sometimes, and there is occasional movement from the police post behind the house. Rain is quiet indoors — the attic and roof absorb most of it.",
  },
  /** Approximate, pending an exact count from the hosts. */
  stepsApprox: "50–60",
  roomCount: 6,
} as const;

/** Pre-filled WhatsApp enquiry, since booking runs through WhatsApp for now. */
export function whatsappUrl(message?: string): string {
  const digits = site.whatsapp.replace(/[^\d]/g, "");
  const body =
    message ??
    "Hello — I'd like to check availability at Kora House.\n\nDates:\nGuests:\nRoom preference (optional):\nAnything else:";
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

// Routes are unchanged; only the labels are new. Renaming /house and
// /experiences would break any link already shared, and the content plan was
// written without sight of the built IA — so the labels move, the slugs don't.
export const nav = [
  { label: "The Story", href: "/house" },
  { label: "Rooms", href: "/rooms" },
  { label: "The Walk", href: "/experiences" },
  { label: "Guidebook", href: "/guidebook" },
  { label: "Getting Here", href: "/getting-here" },
  { label: "Book", href: "/book" },
] as const;

/**
 * Distances confirmed by the hosts' guidebook. Anything not listed here is
 * still unknown — do not estimate it.
 */
export const distances = {
  market: "About 500 m",
  // The hosts state ~500 m to the entrance of His Holiness' residence. Their
  // guidebook separately puts One Two Café, at the temple entrance, at 550 m.
  // Same walk, two roundings — the hosts' own direct figure is used.
  templeEntrance: "About 500 m",
  theOtherSpace: "800 m",
  tushita: "40 minutes to an hour on foot",
  bhagsu: "About 2 km from McLeodganj",
  library: "About 30 minutes on foot down Jogiwara Road",
  sidhbari: "About 20 minutes by taxi",
  triund: "9 km · 1,105 m ascent · about 3 hours up",
} as const;

/**
 * The approach, in the hosts' own description. Buddha House Road is what the
 * map calls it; locals call it the Kora.
 */
export const approach = {
  road: "Buddha House Road — locals call it the Kora",
  vehicles: "Restricted vehicular access",
  view:
    "The stone boundary wall of His Holiness' residence on one side, the valley open on the other.",
  gradient:
    "Parts of it climb. That is the point, more or less: it lifts your heart rate and fills your lungs with mountain air on the way.",
} as const;
