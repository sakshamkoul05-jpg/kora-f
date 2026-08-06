// Verified property facts — see kora-house-build-spec.md §2.
// Anything marked TODO_CONFIRM must be confirmed with the hosts before shipping.

export const site = {
  name: "Kora House",
  tagline: "A house on the hill, not a hotel",
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
    // TODO_CONFIRM: confirm spelling and how each host wants to be named.
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
  caveats: {
    stairs:
      "A significant number of stairs and no lift. Not suited to guests with mobility difficulty — Room 1 is the one ground-floor option.",
    market: "The market is roughly a kilometre away.",
    housekeeping: "Housekeeping is not daily.",
  },
  roomCount: 6,
} as const;

export const nav = [
  { label: "Rooms", href: "/rooms" },
  { label: "The House", href: "/house" },
  { label: "Experiences", href: "/experiences" },
  { label: "Getting Here", href: "/getting-here" },
  { label: "FAQ", href: "/faq" },
] as const;
