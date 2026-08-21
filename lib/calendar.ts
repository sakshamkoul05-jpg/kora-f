import { parseDate } from "./booking.ts";

/**
 * The month grid behind the host calendar.
 *
 * Pure, because the interesting part is not the drawing — it is deciding what
 * a given room is doing on a given night, and getting the half-open ranges
 * right. A stay of 1–4 April occupies the nights of the 1st, 2nd and 3rd. The
 * 4th is a departure and the room is free that night for someone else. Getting
 * that wrong shows a guesthouse as full when it has a room, which is the exact
 * failure a calendar is meant to prevent.
 */

export type CellState = "free" | "pending" | "held" | "confirmed" | "blocked";

export type DayCell = {
  date: string;
  state: CellState;
  bookingId: string | null;
  guestName: string | null;
  reference: string | null;
  /** Pending requests touching this night. They hold nothing; several may overlap. */
  pendingCount: number;
  /** First night of this stay, for drawing the leading edge of a run. */
  isArrival: boolean;
  /** Last night of this stay — the guest leaves the following morning. */
  isLastNight: boolean;
};

export type RoomRow = {
  roomId: string;
  name: string;
  number: number;
  days: DayCell[];
};

export type CalendarBooking = {
  id: string;
  reference: string;
  roomId: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  guestName: string;
};

export type CalendarBlock = {
  roomId: string | null;
  startsOn: string;
  endsOn: string;
  reason: string | null;
};

/** Days in a month. Month is 1-based, the way a human writes it. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Every date of a month as `YYYY-MM-DD`. */
export function monthDates(year: number, month: number): string[] {
  const count = daysInMonth(year, month);
  const mm = String(month).padStart(2, "0");
  return Array.from({ length: count }, (_, i) => `${year}-${mm}-${String(i + 1).padStart(2, "0")}`);
}

/** Does a half-open range cover this night? */
function covers(date: string, start: string, end: string): boolean {
  return date >= start && date < end;
}

/** Which state wins when several things touch the same night. */
const PRECEDENCE: Record<CellState, number> = {
  free: 0,
  pending: 1,
  blocked: 2,
  held: 3,
  confirmed: 4,
};

export function buildMonthGrid({
  year,
  month,
  rooms,
  bookings,
  blocks,
}: {
  year: number;
  month: number;
  rooms: { id: string; name: string; number: number }[];
  bookings: readonly CalendarBooking[];
  blocks: readonly CalendarBlock[];
}): RoomRow[] {
  const dates = monthDates(year, month);

  return rooms.map((room) => {
    const days: DayCell[] = dates.map((date) => {
      const cell: DayCell = {
        date,
        state: "free",
        bookingId: null,
        guestName: null,
        reference: null,
        pendingCount: 0,
        isArrival: false,
        isLastNight: false,
      };

      for (const b of bookings) {
        if (b.roomId !== room.id) continue;
        if (!covers(date, b.checkIn, b.checkOut)) continue;

        if (b.status === "pending") {
          cell.pendingCount++;
          if (PRECEDENCE.pending > PRECEDENCE[cell.state]) {
            cell.state = "pending";
            // A pending request is not attached to the cell as "the" booking:
            // it holds nothing, and several can overlap.
          }
          continue;
        }

        const state: CellState | null =
          b.status === "confirmed" ? "confirmed" : b.status === "accepted" ? "held" : null;
        if (!state) continue;

        if (PRECEDENCE[state] >= PRECEDENCE[cell.state]) {
          cell.state = state;
          cell.bookingId = b.id;
          cell.guestName = b.guestName;
          cell.reference = b.reference;
          cell.isArrival = date === b.checkIn;
          // The last NIGHT is the day before check-out.
          const lastNight = shiftDate(b.checkOut, -1);
          cell.isLastNight = date === lastNight;
        }
      }

      for (const blk of blocks) {
        if (blk.roomId !== null && blk.roomId !== room.id) continue;
        if (!covers(date, blk.startsOn, blk.endsOn)) continue;
        if (PRECEDENCE.blocked > PRECEDENCE[cell.state]) {
          cell.state = "blocked";
          cell.guestName = blk.reason;
        }
      }

      return cell;
    });

    return { roomId: room.id, name: room.name, number: room.number, days };
  });
}

/** `2027-04-01` + n days, staying in UTC. */
export function shiftDate(iso: string, days: number): string {
  const d = parseDate(iso);
  if (!d) return iso;
  return new Date(d.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Previous/next month, wrapping the year. */
export function stepMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zero = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

/** How full the house is that month — nights sold over nights available. */
export function occupancy(rows: readonly RoomRow[]): { sold: number; total: number; percent: number } {
  let sold = 0;
  let total = 0;
  for (const row of rows) {
    for (const day of row.days) {
      total++;
      if (day.state === "confirmed" || day.state === "held") sold++;
    }
  }
  return { sold, total, percent: total === 0 ? 0 : Math.round((sold / total) * 100) };
}
