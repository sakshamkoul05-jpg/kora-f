import Link from "next/link";
import type { Room } from "@/lib/rooms";
import { PhotoPending } from "./PhotoPending";

export function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      href={`/rooms/${room.slug}`}
      className="hairline group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-paper transition-colors hover:border-ink/30"
    >
      <PhotoPending label="Photo coming soon" className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-lg">{room.name}</p>
          <span className="eyebrow text-ink/50">{room.floor} floor</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-[var(--radius-kora)] bg-deodar/10 px-2 py-0.5 text-xs text-deodar">
            {room.hasKitchen ? "Self-catering" : "No kitchen"}
          </span>
          {room.noStairsFromEntrance && (
            <span className="rounded-[var(--radius-kora)] bg-maroon/10 px-2 py-0.5 text-xs text-maroon">
              No stairs from entrance
            </span>
          )}
        </div>
        {room.notes && <p className="text-sm text-ink/60">{room.notes}</p>}
        <p className="mt-auto pt-2 font-data text-sm text-ink/70">
          {room.nightlyRate ? `From ₹${room.nightlyRate}/night` : "Rate available on request"}
        </p>
      </div>
    </Link>
  );
}
