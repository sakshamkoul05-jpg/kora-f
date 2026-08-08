// Room inventory — see kora-house-build-spec.md §3.
//
// Floor, kitchen and the ground-floor/no-stairs fact are CONFIRMED and come
// from the build spec. Everything else is not.
//
// The names below are the set proposed in the content plan — each a station on
// the kora rather than a "Deluxe/Suite" tier. They are mapped onto the rooms in
// order, which is a guess: the plan proposed them without sight of the floor
// plan and explicitly said to confirm which name belongs to which room.
//
// TODO_CONFIRM: name-to-room mapping, occupancy, beds, size, nightly rate, and
// which window looks at what. The plan suggested a view for each name
// (valley-facing, temple roofline, and so on) — those are NOT recorded here,
// because they were invented to illustrate the naming idea and no one has
// confirmed them. Do not put a view in the copy until someone has stood in the
// room. Ask before inventing prices.

export type Room = {
  slug: string;
  number: number;
  /** Proposed name — see TODO_CONFIRM above. */
  name: string;
  floor: "Ground" | "First";
  hasKitchen: boolean;
  /** True only for the one room reachable without climbing stairs. */
  noStairsFromEntrance: boolean;
  /** What the name refers to on the walk. Safe to state — it is about the kora, not the room. */
  nameNote: string;
  notes?: string;
  occupancy: number | null;
  beds: string | null;
  sizeSqm: number | null;
  nightlyRate: number | null;
  /** What still has to come from the hosts before this room can be sold properly. */
  todoConfirm: string[];
};

const baseTodo = ["name mapping", "occupancy", "beds", "sizeSqm", "nightlyRate", "view"];

export const rooms: Room[] = [
  {
    slug: "mani",
    number: 1,
    name: "Mani",
    floor: "Ground",
    hasKitchen: false,
    noStairsFromEntrance: true,
    nameNote: "For the mani stones set along the wall of the path outside.",
    notes:
      "The only room reachable without stairs from the entrance — the option for guests who can't manage the climb.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "zangskar",
    number: 2,
    name: "Zangskar",
    floor: "First",
    hasKitchen: true,
    noStairsFromEntrance: false,
    nameNote: "For the deep maroon of the robes worn in the temple below.",
    notes: "Self-catering, with its own kitchen.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "deodar",
    number: 3,
    name: "Deodar",
    floor: "First",
    hasKitchen: true,
    noStairsFromEntrance: false,
    nameNote: "For the cedar that lines the path up toward Dharamkot.",
    notes: "Self-catering, with its own kitchen.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "chorten",
    number: 4,
    name: "Chorten",
    floor: "First",
    hasKitchen: true,
    noStairsFromEntrance: false,
    nameNote: "For the stupa standing on the circuit.",
    notes: "Self-catering, with its own kitchen.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "dhauladhar",
    number: 5,
    name: "Dhauladhar",
    floor: "First",
    hasKitchen: false,
    noStairsFromEntrance: false,
    nameNote: "For the range that closes the far side of the valley.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "butter-lamp",
    number: 6,
    name: "Butter Lamp",
    floor: "First",
    hasKitchen: false,
    noStairsFromEntrance: false,
    nameNote: "For the lamps kept burning in the temple hall.",
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

export const sharedSpaces = [
  {
    name: "The balcony",
    description:
      "Shared, and the reason most guests come back. It catches the valley at the end of the day, and it is where everyone ends up with their morning tea.",
  },
  {
    name: "The dining room",
    description: "Shared, downstairs, and the other place people end up talking.",
  },
] as const;
