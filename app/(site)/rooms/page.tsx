import type { Metadata } from "next";
import Link from "next/link";
import { Ornament, SectionMark } from "@/components/Ornament";
import { RoomsFilterGrid } from "@/components/RoomsFilterGrid";
import { rooms, sharedSpaces } from "@/lib/rooms";
import Image from "next/image";
import { sittingRoomPhotos, commonAreaPhotos } from "@/lib/sitting-photos";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rooms — Kora House, McLeodganj",
  description:
    "Five rooms at Kora House, each named for a stop on the kora walk, with views across the Dhauladhar range and Kangra valley.",
};

export default function RoomsIndexPage() {

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Five rooms" variant="knot" />
      <h1 className="display-xl mt-5">Where to stay</h1>
      <p className="lede mt-6 max-w-xl">
        Each room is named for a stop on the walk outside — a mani stone, the
        stupa, the cedar, the range — rather than a room tier. Two have their
        own kitchenette. There is also a common kitchen any guest can use, a
        sitting room beside the dining room, and the balcony.
      </p>

      <div className="mt-10 max-w-xl rounded-[var(--radius-card)] border border-maroon/25 bg-maroon/[0.06] p-6">
        <p className="eyebrow text-maroon">Before you book</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          There are roughly {site.stepsApprox} steps from the car park up to the
          house, and no lift. <strong>Every room is above that climb</strong> —
          all five are on the first floor of the house, up the steps from the
          car park. The caretaker will carry your bags.
        </p>
      </div>

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

        <div className="mt-12">
          <p className="eyebrow text-ink/45">The sitting room, as it is</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {sittingRoomPhotos.slice(0, 3).map((p) => (
              <div
                key={p.alt}
                className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sittingRoomPhotos.slice(3).map((p) => (
              <div
                key={p.alt}
                className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <p className="eyebrow text-ink/45">The common area, as it is</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {commonAreaPhotos.map((p) => (
              <div
                key={p.alt}
                className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
