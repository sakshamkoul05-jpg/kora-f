import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ornament } from "@/components/Ornament";
import { PhotoPending } from "@/components/PhotoPending";
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
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <Link
        href="/rooms"
        className="eyebrow text-ink/45 transition-colors hover:text-ink"
      >
        ← All rooms
      </Link>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <PhotoPending
          label="Photo coming soon"
          className="aspect-[4/3] rounded-[var(--radius-card)] sm:col-span-2 sm:row-span-2 sm:aspect-auto"
        />
        <PhotoPending className="aspect-[4/3] rounded-[var(--radius-card)]" />
        <PhotoPending className="aspect-[4/3] rounded-[var(--radius-card)]" />
      </div>

      <div className="mt-14 grid gap-14 md:grid-cols-[1fr_370px]">
        <div>
          <Ornament variant="knot" />
          <h1 className="display-xl mt-4">{room.name}</h1>
          <p className="mt-3 font-data text-sm text-ink-soft">{metaParts.join(" · ")}</p>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-[var(--radius-kora)] bg-deodar/12 px-3 py-1.5 text-xs text-deodar">
              {room.hasKitchen ? "Self-catering kitchen" : "No kitchen"}
            </span>
            {room.noStairsFromEntrance && (
              <span className="rounded-[var(--radius-kora)] bg-maroon/12 px-3 py-1.5 text-xs text-maroon">
                No stairs from entrance
              </span>
            )}
          </div>

          {room.notes && <p className="lede mt-8">{room.notes}</p>}

          <p className="mt-6 border-l-2 border-butter/50 pl-4 text-sm text-ink-soft/80">
            Exact occupancy, bed configuration and room size are still being
            confirmed with the hosts — message the house for the current detail.
          </p>

          <div className="mt-14 border-t border-ink/10 pt-10">
            <p className="eyebrow text-ink/45">Good to know</p>
            <ul className="mt-5 space-y-4">
              {[site.caveats.stairs, site.caveats.market, site.caveats.housekeeping].map((c) => (
                <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-butter" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="h-fit rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-7 md:sticky md:top-28">
          <p className="eyebrow text-ink/45">Nightly rate</p>
          <p className="display-lg mt-2">
            {room.nightlyRate ? `₹${room.nightlyRate}` : "On request"}
          </p>
          <div className="my-6 h-px w-full bg-ink/10" />
          <PrimaryButton href="/rooms" className="block w-full">
            Check availability
          </PrimaryButton>
          <p className="mt-4 text-center text-xs leading-relaxed text-ink/45">
            Online booking opens soon. For now, message the house on WhatsApp
            and the hosts will confirm.
          </p>
        </aside>
      </div>
    </div>
  );
}
