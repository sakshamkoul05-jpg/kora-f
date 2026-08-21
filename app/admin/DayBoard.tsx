import Link from "next/link";
import { formatDate } from "@/lib/dates";
import type { DayBoard as Board, StayLike } from "@/lib/today";

/**
 * The morning board.
 *
 * Everything a host needs before the first guest is awake: who leaves, who
 * arrives, who is already here, and which rooms have to be turned around
 * between a departure and an arrival on the same day. That last one is the
 * thing a list of bookings can never tell you at a glance, and it is the thing
 * that decides what the caretaker does first.
 */
export function DayBoard({ board, today }: { board: Board; today: string }) {
  const nothing =
    board.arriving.length === 0 && board.departing.length === 0 && board.staying.length === 0;

  return (
    <section className="mt-10 rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display-md">Today</h2>
        <p className="font-data text-xs text-ink/45">{formatDate(today)} · McLeodganj</p>
      </div>

      {nothing ? (
        <p className="mt-4 text-sm text-ink-soft">
          Nobody arriving, leaving or staying. A quiet one.
        </p>
      ) : (
        <>
          {board.turnarounds.length > 0 && (
            <div className="mt-5 rounded-[var(--radius-kora)] border border-butter/50 bg-butter/[0.12] px-4 py-3">
              <p className="font-data text-[11px] uppercase tracking-wide text-ink/50">
                Turn around first
              </p>
              <ul className="mt-2 space-y-1">
                {board.turnarounds.map((t) => (
                  <li key={t.roomId} className="text-sm text-ink-soft">
                    <span className="font-medium text-ink">{t.roomName}</span> —{" "}
                    {t.out.guestName} leaves, {t.in.guestName} arrives
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <Column title="Leaving" stays={board.departing} empty="Nobody" />
            <Column title="Arriving" stays={board.arriving} empty="Nobody" />
            <Column title="In the house tonight" stays={board.staying} empty="Empty" />
          </div>
        </>
      )}
    </section>
  );
}

function Column({
  title,
  stays,
  empty,
}: {
  title: string;
  stays: StayLike[];
  empty: string;
}) {
  return (
    <div>
      <p className="font-data text-[11px] uppercase tracking-wide text-ink/45">
        {title} <span className="text-ink/30">({stays.length})</span>
      </p>
      {stays.length === 0 ? (
        <p className="mt-2 text-sm text-ink/40">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2.5">
          {stays.map((s) => (
            <li key={s.id}>
              <p className="text-sm">
                <span className="font-medium">{s.guestName}</span>
                {s.roomName && <span className="text-ink/45"> · {s.roomName}</span>}
              </p>
              <p className="font-data text-xs text-ink/45">
                {s.adults + s.children} guest{s.adults + s.children === 1 ? "" : "s"} ·{" "}
                {s.reference}
                {s.status === "accepted" && (
                  <span className="text-maroon"> · deposit not in</span>
                )}
              </p>
              {s.guestPhone && (
                <Link
                  href={`https://wa.me/${s.guestPhone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  className="font-data text-xs text-maroon underline underline-offset-2"
                >
                  {s.guestPhone}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
