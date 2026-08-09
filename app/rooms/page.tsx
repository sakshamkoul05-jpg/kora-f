import type { Metadata } from "next";
import Link from "next/link";
import { Ornament, SectionMark } from "@/components/Ornament";
import { RoomsFilterGrid } from "@/components/RoomsFilterGrid";
import { rooms, sharedSpaces } from "@/lib/rooms";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rooms — Kora House, McLeodganj",
  description:
    "Six rooms at Kora House, each named for a stop on the kora walk, with views across the Dhauladhar range and Kangra valley.",
};

export default function RoomsIndexPage() {
  const groundFloorRoom = rooms.find((r) => r.noStairsFromEntrance);

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Six rooms" variant="knot" />
      <h1 className="display-xl mt-5">Where to stay</h1>
      <p className="lede mt-6 max-w-xl">
        Each room is named for a stop on the walk outside — a mani stone, the
        stupa, the cedar, the range — rather than a room tier. Three are
        self-catering with their own kitchen; the rest share the dining room
        and the balcony.
      </p>

      {groundFloorRoom && (
        <div className="mt-10 max-w-xl rounded-[var(--radius-card)] border border-maroon/25 bg-maroon/[0.06] p-6">
          <p className="eyebrow text-maroon">Before you book</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            There are {site.steps} steps from the car park up to the rooms, and
            no lift.{" "}
            <Link
              href={`/rooms/${groundFloorRoom.slug}`}
              className="border-b border-maroon/40 text-maroon hover:border-maroon"
            >
              {groundFloorRoom.name}
            </Link>{" "}
            is the only room reachable without climbing them.
          </p>
        </div>
      )}

      <div className="mt-14">
        <RoomsFilterGrid rooms={rooms} />
      </div>

      <div className="mt-24 border-t border-ink/10 pt-14">
        <SectionMark eyebrow="Shared spaces" variant="lotus" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {sharedSpaces.map((space) => (
            <div
              key={space.name}
              className="rounded-[var(--radius-card)] border border-ink/10 bg-paper-raised p-7"
            >
              <Ornament variant="cloud" />
              <p className="display-md mt-4">{space.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{space.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
