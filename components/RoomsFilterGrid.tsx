"use client";

import { useMemo, useState } from "react";
import type { Room } from "@/lib/rooms";
import { RoomCard } from "./RoomCard";

type KitchenFilter = "all" | "kitchen" | "no-kitchen";
type FloorFilter = "all" | "Ground" | "First";

export function RoomsFilterGrid({ rooms }: { rooms: Room[] }) {
  const [kitchen, setKitchen] = useState<KitchenFilter>("all");
  const [floor, setFloor] = useState<FloorFilter>("all");

  const filtered = useMemo(
    () =>
      rooms.filter((room) => {
        if (kitchen === "kitchen" && !room.hasKitchen) return false;
        if (kitchen === "no-kitchen" && room.hasKitchen) return false;
        if (floor !== "all" && room.floor !== floor) return false;
        return true;
      }),
    [rooms, kitchen, floor]
  );

  return (
    <div>
      {/* Kitchen and floor are the primary filters — the real differentiators,
          not buried amenity icons. */}
      <div className="flex flex-wrap gap-6">
        <fieldset>
          <legend className="eyebrow text-ink/50">Kitchen</legend>
          <div className="mt-2 flex gap-2">
            {(
              [
                ["all", "All"],
                ["kitchen", "Self-catering"],
                ["no-kitchen", "No kitchen"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKitchen(value)}
                aria-pressed={kitchen === value}
                className={`rounded-[var(--radius-kora)] border px-3 py-1.5 text-sm transition-colors ${
                  kitchen === value
                    ? "border-maroon bg-maroon text-mist"
                    : "border-ink/15 text-ink/70 hover:border-ink/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow text-ink/50">Floor</legend>
          <div className="mt-2 flex gap-2">
            {(
              [
                ["all", "All"],
                ["Ground", "Ground"],
                ["First", "First"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFloor(value)}
                aria-pressed={floor === value}
                className={`rounded-[var(--radius-kora)] border px-3 py-1.5 text-sm transition-colors ${
                  floor === value
                    ? "border-maroon bg-maroon text-mist"
                    : "border-ink/15 text-ink/70 hover:border-ink/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-4 font-data text-xs text-ink/50" role="status">
        {filtered.length} of {rooms.length} rooms
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {filtered.map((room) => (
          <RoomCard key={room.slug} room={room} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-sm text-ink/60">
            No rooms match those filters.
          </p>
        )}
      </div>
    </div>
  );
}
