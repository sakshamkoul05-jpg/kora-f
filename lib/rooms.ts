// Room inventory.
//
// Numbering is the hosts': facing the building from the front, the rightmost
// upstairs room is Room 1 and the leftmost is Room 5. The ground-floor room is
// Room 6. Rooms are listed in that order.
//
// ── Corrections applied from client feedback ──────────────────────────────
//  • The ground-floor room is Room 6, not Room 1.
//  • Two rooms have a kitchenette, not three, and it is a kitchenette rather
//    than a kitchen. There is also a common kitchen any guest may use.
//  • THE GROUND-FLOOR ROOM IS NOT STEP-FREE. An earlier version claimed it
//    could be reached without climbing. That was wrong, and wrong in the
//    direction that matters — someone with bad knees could have booked on it.
//    There is no step-free room here. Do not reintroduce that claim.
//
// TODO_CONFIRM: which name belongs to which room number, occupancy, beds,
// size, nightly rate, and what each window looks at. Names are the set the
// content plan proposed; only Mani ↔ Room 6 is confirmed, from the hosts'
// own example.

export type Room = {
  slug: string;
  /** The hosts' room number. Shown to guests alongside the name. */
  number: number;
  name: string;
  floor: "Ground" | "First";
  /** A kitchenette in the room. Separate from the common kitchen downstairs. */
  hasKitchenette: boolean;
  nameNote: string;
  notes?: string;
  occupancy: number | null;
  beds: string | null;
  sizeSqm: number | null;
  nightlyRate: number | null;
  todoConfirm: string[];
};

const baseTodo = ["name-to-number mapping", "occupancy", "beds", "sizeSqm", "nightlyRate", "view"];

export const rooms: Room[] = [
  {
    slug: "zangskar",
    number: 1,
    name: "Zangskar",
    floor: "First",
    hasKitchenette: true,
    nameNote: "For the deep maroon of the robes worn in the temple below.",
    notes: "Has its own kitchenette.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "deodar",
    number: 2,
    name: "Deodar",
    floor: "First",
    hasKitchenette: true,
    nameNote: "For the cedar that lines the path up toward Dharamkot.",
    notes: "Has its own kitchenette.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "chorten",
    number: 3,
    name: "Chorten",
    floor: "First",
    hasKitchenette: false,
    nameNote: "For the stupa standing on the circuit.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "dhauladhar",
    number: 4,
    name: "Dhauladhar",
    floor: "First",
    hasKitchenette: false,
    nameNote: "For the range that closes the far side of the valley.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "butter-lamp",
    number: 5,
    name: "Butter Lamp",
    floor: "First",
    hasKitchenette: false,
    nameNote: "For the lamps kept burning in the temple hall.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "mani",
    number: 6,
    name: "Mani",
    floor: "Ground",
    hasKitchenette: false,
    nameNote: "For the mani stones set along the wall of the path outside.",
    notes:
      "On the ground floor of the house — though you still climb the steps from the car park to reach it.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
];

export function getRoomBySlug(slug: string): Room | undefined {
  return rooms.find((r) => r.slug === slug);
}

export const kitchenetteCount = rooms.filter((r) => r.hasKitchenette).length;

export const sharedSpaces = [
  {
    name: "The balcony",
    description:
      "Shared, and the reason most guests come back. It catches the valley at the end of the day, and it is where everyone ends up with their morning chai.",
  },
  {
    name: "The sitting room",
    description:
      "A shared room next to the dining room, for reading, for talking, or for waiting out an afternoon of rain.",
  },
  {
    name: "The dining room",
    description:
      "Where morning and evening tea and coffee happen, and where most conversations between guests start.",
  },
  {
    name: "The common kitchen",
    description:
      "Any guest may use it, whether or not their room has a kitchenette of its own.",
  },
] as const;
