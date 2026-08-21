/**
 * What is happening in the house today.
 *
 * The distinctions matter and are easy to get subtly wrong. Someone who checks
 * out today is NOT in the house tonight, but they are very much your problem
 * this morning. Someone arriving today is not in the house yet. And a room that
 * sees a departure and an arrival on the same day has to be turned around
 * between them, which is the single most useful thing this screen can tell you.
 */

export type StayLike = {
  id: string;
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone: string | null;
  adults: number;
  children: number;
  roomId: string | null;
  roomName: string | null;
};

export type DayBoard = {
  arriving: StayLike[];
  departing: StayLike[];
  /** In the house tonight — excludes today's departures, includes today's arrivals. */
  staying: StayLike[];
  /** Rooms with a departure AND an arrival today. Turn these around first. */
  turnarounds: { roomId: string; roomName: string | null; out: StayLike; in: StayLike }[];
};

/** Only a stay someone has actually committed to counts as occupancy. */
const HOLDS = new Set(["confirmed", "accepted"]);

export function buildDayBoard(stays: readonly StayLike[], today: string): DayBoard {
  const live = stays.filter((s) => HOLDS.has(s.status));

  const arriving = live.filter((s) => s.checkIn === today);
  const departing = live.filter((s) => s.checkOut === today);
  const staying = live.filter((s) => s.checkIn <= today && s.checkOut > today);

  const turnarounds: DayBoard["turnarounds"] = [];
  for (const out of departing) {
    if (!out.roomId) continue;
    const next = arriving.find((a) => a.roomId === out.roomId);
    if (next) {
      turnarounds.push({ roomId: out.roomId, roomName: out.roomName, out, in: next });
    }
  }

  const byName = (a: StayLike, b: StayLike) =>
    (a.roomName ?? "").localeCompare(b.roomName ?? "") || a.guestName.localeCompare(b.guestName);

  return {
    arriving: [...arriving].sort(byName),
    departing: [...departing].sort(byName),
    staying: [...staying].sort(byName),
    turnarounds,
  };
}

/** Today in McLeodganj, which is the day the house is actually having. */
export function todayInIndia(now: Date = new Date()): string {
  return new Date(now.getTime() + (5 * 60 + 30) * 60_000).toISOString().slice(0, 10);
}
