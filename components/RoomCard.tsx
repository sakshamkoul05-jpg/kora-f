import Link from "next/link";
import type { Room } from "@/lib/rooms";
import { PhotoPending } from "./PhotoPending";

export function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      href={`/rooms/${room.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-paper-raised transition-colors duration-300 hover:border-ink/25"
    >
      <PhotoPending label="Photo coming soon" className="aspect-[4/3] w-full" />

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="display-md">{room.name}</p>
          <span className="eyebrow shrink-0 text-ink/40">{room.floor}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-[var(--radius-kora)] bg-deodar/12 px-2.5 py-1 text-[11px] tracking-wide text-deodar">
            {room.hasKitchen ? "Self-catering" : "No kitchen"}
          </span>
          {room.noStairsFromEntrance && (
            <span className="rounded-[var(--radius-kora)] bg-maroon/12 px-2.5 py-1 text-[11px] tracking-wide text-maroon">
              No stairs
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">
          {room.notes ?? room.nameNote}
        </p>

        <p className="mt-auto border-t border-ink/10 pt-4 font-data text-sm text-ink-soft">
          {room.nightlyRate ? `From ₹${room.nightlyRate} / night` : "Rate on request"}
        </p>
      </div>
    </Link>
  );
}
