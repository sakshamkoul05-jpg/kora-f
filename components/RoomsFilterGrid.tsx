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
        if (kitchen === "kitchen" && !room.hasKitchenette) return false;
        if (kitchen === "no-kitchen" && room.hasKitchenette) return false;
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
          <legend className="eyebrow text-ink/45">Kitchenette</legend>
          <div className="mt-2 flex gap-2">
            {(
              [
                ["all", "All"],
                ["kitchen", "Has one"],
                ["no-kitchen", "Shared only"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKitchen(value)}
                aria-pressed={kitchen === value}
                className={`rounded-[var(--radius-kora)] border px-4 py-2 text-sm transition-colors ${
                  kitchen === value
                    ? "border-maroon bg-maroon text-paper"
                    : "border-ink/20 text-ink-soft hover:border-ink/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow text-ink/45">Floor</legend>
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
                className={`rounded-[var(--radius-kora)] border px-4 py-2 text-sm transition-colors ${
                  floor === value
                    ? "border-maroon bg-maroon text-paper"
                    : "border-ink/20 text-ink-soft hover:border-ink/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-6 font-data text-xs text-ink/45" role="status">
        {filtered.length} of {rooms.length} rooms
      </p>

      <div className="mt-7 grid gap-7 md:grid-cols-3">
        {filtered.map((room) => (
          <RoomCard key={room.slug} room={room} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-sm text-ink-soft">
            No rooms match those filters.
          </p>
        )}
      </div>
    </div>
  );
}
