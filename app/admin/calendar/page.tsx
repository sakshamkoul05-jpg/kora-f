import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildMonthGrid,
  monthDates,
  occupancy,
  shiftDate,
  stepMonth,
  type CalendarBooking,
  type CellState,
} from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Calendar — Kora House",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The month at a glance.
 *
 * Nobody runs a guesthouse from a list. This answers "what does next week look
 * like" in one look, which the request list cannot do at any length.
 *
 * Server-rendered, month navigation by link. No client JavaScript at all — the
 * build spec keeps the admin still, and a calendar is the last place anyone
 * wants a loading state.
 */

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

const CELL: Record<CellState, string> = {
  free: "bg-transparent",
  pending: "bg-butter/30",
  blocked: "bg-ink/15",
  held: "bg-maroon/35",
  confirmed: "bg-deodar/45",
};

const LEGEND: { state: CellState; label: string; note: string }[] = [
  { state: "confirmed", label: "Confirmed", note: "deposit paid" },
  { state: "held", label: "Held", note: "accepted, awaiting deposit" },
  { state: "pending", label: "Asked for", note: "holds nothing" },
  { state: "blocked", label: "Blocked", note: "not for sale" },
];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSupabaseConfigured) redirect("/admin");

  const supabase = await createClient();
  if (!supabase) redirect("/admin/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";

  const now = new Date();
  const year = Number(one("y")) || now.getUTCFullYear();
  const month = Math.min(12, Math.max(1, Number(one("m")) || now.getUTCMonth() + 1));

  const dates = monthDates(year, month);
  const first = dates[0];
  const afterLast = shiftDate(dates[dates.length - 1], 1);

  await supabase.rpc("expire_stale_holds");

  // Anything overlapping the window: starts before it ends, ends after it starts.
  const [{ data: rooms }, { data: bookings }, { data: blocks }] = await Promise.all([
    supabase.from("rooms").select("id, name, room_number").eq("is_active", true).order("sort_order"),
    supabase
      .from("booking_requests")
      .select("id, reference, room_id, check_in, check_out, status, guest_name")
      .lt("check_in", afterLast)
      .gt("check_out", first),
    supabase
      .from("blocked_dates")
      .select("room_id, starts_on, ends_on, reason")
      .lt("starts_on", afterLast)
      .gt("ends_on", first),
  ]);

  const rows = buildMonthGrid({
    year,
    month,
    rooms: (rooms ?? []).map((r) => ({ id: r.id, name: r.name, number: r.room_number })),
    bookings: ((bookings ?? []) as unknown as {
      id: string; reference: string; room_id: string | null;
      check_in: string; check_out: string; status: string; guest_name: string;
    }[]).map<CalendarBooking>((b) => ({
      id: b.id,
      reference: b.reference,
      roomId: b.room_id,
      checkIn: b.check_in,
      checkOut: b.check_out,
      status: b.status,
      guestName: b.guest_name,
    })),
    blocks: (blocks ?? []).map((b) => ({
      roomId: b.room_id,
      startsOn: b.starts_on,
      endsOn: b.ends_on,
      reason: b.reason,
    })),
  });

  const stats = occupancy(rows);
  const prev = stepMonth(year, month, -1);
  const next = stepMonth(year, month, 1);
  const todayIso = now.toISOString().slice(0, 10);
  const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-ink-soft underline underline-offset-4">
            ← Requests
          </Link>
          <h1 className="display-lg mt-3">{monthName}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {stats.sold} of {stats.total} room-nights sold ·{" "}
            <span className="font-data">{stats.percent}%</span> full
          </p>
        </div>

        <nav className="flex items-center gap-2" aria-label="Change month">
          <Link
            href={`/admin/calendar?y=${prev.year}&m=${prev.month}`}
            className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm"
          >
            ←
          </Link>
          <Link
            href="/admin/calendar"
            className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm"
          >
            This month
          </Link>
          <Link
            href={`/admin/calendar?y=${next.year}&m=${next.month}`}
            className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm"
          >
            →
          </Link>
        </nav>
      </div>

      {/* A month never fits a phone. It scrolls sideways with the room names
          pinned, rather than shrinking to something unreadable. */}
      <div className="mt-8 overflow-x-auto rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-paper-raised px-3 py-2.5 text-left font-data text-[10px] uppercase tracking-wide text-ink/45"
              >
                Room
              </th>
              {dates.map((d) => {
                const day = Number(d.slice(8));
                const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
                const isToday = d === todayIso;
                const weekend = dow === 0 || dow === 6;
                return (
                  <th
                    key={d}
                    scope="col"
                    className={`px-0 py-2 text-center font-data text-[10px] font-normal ${
                      isToday ? "text-maroon" : weekend ? "text-ink/50" : "text-ink/35"
                    }`}
                  >
                    <span className="block">{WEEKDAY[dow]}</span>
                    <span className={`block ${isToday ? "font-medium" : ""}`}>{day}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.roomId} className="border-t border-ink/8">
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-paper-raised px-3 py-2 text-left font-normal"
                >
                  {row.name}
                  <span className="ml-1.5 text-ink/35">#{row.number}</span>
                </th>
                {row.days.map((cell) => {
                  const title =
                    cell.state === "free"
                      ? `${cell.date} — free`
                      : cell.state === "pending"
                        ? `${cell.date} — ${cell.pendingCount} request${cell.pendingCount === 1 ? "" : "s"} waiting`
                        : `${cell.date} — ${cell.guestName ?? cell.state}${cell.reference ? ` (${cell.reference})` : ""}`;
                  return (
                    <td key={cell.date} className="p-0" title={title}>
                      <div
                        className={`mx-px h-8 ${CELL[cell.state]} ${
                          cell.isArrival ? "rounded-l-[3px]" : ""
                        } ${cell.isLastNight ? "rounded-r-[3px]" : ""}`}
                      >
                        {cell.state === "pending" && (
                          <span className="sr-only">{cell.pendingCount} pending</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
        {LEGEND.map((l) => (
          <span key={l.state} className="flex items-center gap-2 text-xs text-ink-soft">
            <span className={`h-3.5 w-6 rounded-[2px] ${CELL[l.state]} border border-ink/10`} />
            {l.label} <span className="text-ink/40">· {l.note}</span>
          </span>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink/45">
        A stay shows on the nights it occupies, so a guest leaving on the 13th
        does not colour the 13th — that room is free to sell that night. Hover a
        cell for the guest and reference.
      </p>
    </div>
  );
}
