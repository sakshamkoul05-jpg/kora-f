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
  googleReviewUrl: "https://www.google.com/maps/place/?q=place_id:TODO_CONFIRM",
  rating: { value: 4.7, count: 69 },
  hosts: [
    // TODO_CONFIRM: confirm spelling, and whether these are the current hosts.
    // The content plan flags that existing guest reviews name previous hosts —
    // if this is a relaunch under new ownership the bios must be rewritten.
    { name: "Rohitash", role: "Host" },
    { name: "Ashish", role: "Host" },
  ],
  caretaker: {
    // TODO_CONFIRM: confirm spelling.
    name: "Suraj",
    role: "Caretaker",
    onSiteHours: "9am–5pm",
    note: "Reachable by phone outside those hours",
  },
  // These three are load-bearing. The build spec requires them present and
  // findable rather than buried — they prevent the mismatched-expectation
  // review. Do not soften them to fit a nicer sentence.
  caveats: {
    stairs:
      "A significant number of stairs and no lift. Not suited to guests with mobility difficulty — Mani, on the ground floor, is the one room reachable without the climb.",
    market: "The market is roughly a kilometre away.",
    housekeeping: "Housekeeping is not daily.",
  },
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
  { label: "Getting Here", href: "/getting-here" },
  { label: "Book", href: "/book" },
] as const;
