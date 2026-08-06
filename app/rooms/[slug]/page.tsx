import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrimaryButton } from "@/components/PrimaryButton";
import { getRoomBySlug, rooms } from "@/lib/rooms";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  return { title: room ? `${room.name} — Kora House` : "Room not found" };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  if (!room) notFound();

  const metaParts = [
    room.occupancy ? `Sleeps ${room.occupancy}` : null,
    room.beds,
    room.sizeSqm ? `${room.sizeSqm} m²` : null,
    `${room.floor} floor`,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <Link href="/rooms" className="text-sm text-ink/50 hover:text-ink">
        ← All rooms
      </Link>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="aspect-[4/3] rounded-[var(--radius-kora)] bg-ink/10 sm:col-span-2 sm:row-span-2" aria-hidden />
        <div className="aspect-[4/3] rounded-[var(--radius-kora)] bg-ink/10" aria-hidden />
        <div className="aspect-[4/3] rounded-[var(--radius-kora)] bg-ink/10" aria-hidden />
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_360px]">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">{room.name}</h1>
          <p className="mt-2 font-data text-sm text-ink/60">{metaParts.join(" · ")}</p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            <span className="rounded-[var(--radius-kora)] bg-deodar/10 px-2 py-1 text-xs text-deodar">
              {room.hasKitchen ? "Self-catering kitchen" : "No kitchen"}
            </span>
            {room.noStairsFromEntrance && (
              <span className="rounded-[var(--radius-kora)] bg-maroon/10 px-2 py-1 text-xs text-maroon">
                No stairs from entrance
              </span>
            )}
          </div>

          {room.notes && <p className="mt-6 text-ink/70">{room.notes}</p>}

          <p className="mt-6 text-sm text-ink/50">
            Exact occupancy, bed configuration and room size are being
            confirmed with the hosts — get in touch for the current detail.
          </p>

          <div className="hairline-t mt-10 pt-8">
            <p className="eyebrow text-ink/50">Good to know</p>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              <li>{site.caveats.stairs}</li>
              <li>{site.caveats.market}</li>
              <li>{site.caveats.housekeeping}</li>
            </ul>
          </div>
        </div>

        <aside className="hairline h-fit rounded-[var(--radius-kora)] bg-paper p-6">
          <p className="font-data text-sm text-ink/50">Nightly rate</p>
          <p className="mt-1 font-display text-2xl">
            {room.nightlyRate ? `₹${room.nightlyRate}` : "On request"}
          </p>
          <PrimaryButton href="/rooms" className="mt-6 block">
            Check availability
          </PrimaryButton>
          <p className="mt-3 text-center text-xs text-ink/40">
            Booking opens soon — message the house on WhatsApp for now.
          </p>
        </aside>
      </div>
    </div>
  );
}
