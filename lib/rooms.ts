// Room inventory — see kora-house-build-spec.md §3.
// Six rooms, confirmed by the hosts. Name, occupancy, beds, size and nightly
// rate are NOT yet confirmed — every such field is `null` and flagged in
// `todoConfirm`. Do not invent numbers here; ask before filling them in.

export type Room = {
  slug: string;
  number: number;
  /** Placeholder until the hosts confirm real room names. */
  name: string;
  floor: "Ground" | "First";
  hasKitchen: boolean;
  /** True only for the one room reachable without climbing stairs. */
  noStairsFromEntrance: boolean;
  notes?: string;
  occupancy: number | null;
  beds: string | null;
  sizeSqm: number | null;
  nightlyRate: number | null;
  todoConfirm: string[];
};

const baseTodo = ["name", "occupancy", "beds", "sizeSqm", "nightlyRate"];

export const rooms: Room[] = [
  {
    slug: "room-1",
    number: 1,
    name: "Room 1",
    floor: "Ground",
    hasKitchen: false,
    noStairsFromEntrance: true,
    notes:
      "The only room reachable without stairs from the entrance — the option for guests who can't manage the climb.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "room-2",
    number: 2,
    name: "Room 2",
    floor: "First",
    hasKitchen: true,
    noStairsFromEntrance: false,
    notes: "Self-catering.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "room-3",
    number: 3,
    name: "Room 3",
    floor: "First",
    hasKitchen: true,
    noStairsFromEntrance: false,
    notes: "Self-catering.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "room-4",
    number: 4,
    name: "Room 4",
    floor: "First",
    hasKitchen: true,
    noStairsFromEntrance: false,
    notes: "Self-catering.",
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "room-5",
    number: 5,
    name: "Room 5",
    floor: "First",
    hasKitchen: false,
    noStairsFromEntrance: false,
    occupancy: null,
    beds: null,
    sizeSqm: null,
    nightlyRate: null,
    todoConfirm: baseTodo,
  },
  {
    slug: "room-6",
    number: 6,
    name: "Room 6",
    floor: "First",
    hasKitchen: false,
    noStairsFromEntrance: false,
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
    name: "Common balcony",
    description:
      "The property's single strongest asset: a shared balcony opening onto the valley.",
  },
  { name: "Dining area", description: "Shared dining space for all guests." },
] as const;
