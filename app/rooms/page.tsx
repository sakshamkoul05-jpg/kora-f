import type { Metadata } from "next";
import Link from "next/link";
import { RoomsFilterGrid } from "@/components/RoomsFilterGrid";
import { rooms, sharedSpaces } from "@/lib/rooms";

export const metadata: Metadata = {
  title: "Rooms — Kora House",
};

export default function RoomsIndexPage() {
  const groundFloorRoom = rooms.find((r) => r.noStairsFromEntrance);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-ink/50">Six rooms</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Where to stay</h1>
      <p className="mt-4 max-w-xl text-ink/70">
        Three rooms are self-catering with their own kitchen; the rest share
        the dining area and common balcony downstairs.
      </p>

      {groundFloorRoom && (
        <div className="hairline mt-8 max-w-xl rounded-[var(--radius-card)] bg-paper p-5">
          <p className="eyebrow text-maroon">Mobility note</p>
          <p className="mt-1 text-sm text-ink/70">
            The house has a significant number of stairs and no lift.{" "}
            <Link href={`/rooms/${groundFloorRoom.slug}`} className="text-maroon underline underline-offset-4">
              {groundFloorRoom.name}
            </Link>{" "}
            is the only room reachable without climbing them.
          </p>
        </div>
      )}

      <div className="mt-10">
        <RoomsFilterGrid rooms={rooms} />
      </div>

      <div className="hairline-t mt-16 pt-8">
        <p className="eyebrow text-ink/50">Shared spaces</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {sharedSpaces.map((space) => (
            <div key={space.name} className="hairline rounded-[var(--radius-card)] p-4">
              <p className="font-display">{space.name}</p>
              <p className="mt-1 text-sm text-ink/60">{space.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
