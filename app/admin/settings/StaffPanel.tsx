"use client";

import { useState } from "react";
import { addStaffMember, removeStaffMember } from "../offers-actions";
import { ErrorLine, Field, Panel, RemoveButton, inputClass, useAction } from "./Panel";

/**
 * Who else can get in.
 *
 * Adding somebody here does NOT create an account — that happens in Supabase
 * Auth, where the person sets their own password. This grants an existing
 * account access to the booking requests, which is a different thing and
 * should stay a different thing.
 */
export function StaffPanel({
  staff,
  currentUserId,
  isAdmin,
}: {
  staff: { userId: string; email: string; role: string }[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const { pending, error, run } = useAction();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"host" | "admin">("host");

  const adminCount = staff.filter((s) => s.role === "admin").length;

  return (
    <Panel
      title="Who can get in"
      count={staff.length}
      blurb="Booking requests hold guests' names, emails and phone numbers, so this list is the gate. Everyone here can read and decide on every request."
    >
      <ErrorLine message={error} />

      <ul className="mb-6 space-y-2">
        {staff.map((s) => (
          <li
            key={s.userId}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-kora)] border border-ink/12 bg-paper px-4 py-3"
          >
            <div>
              <p className="text-sm">
                {s.email}
                {s.userId === currentUserId && <span className="text-ink/45"> · you</span>}
              </p>
              <p className="mt-0.5 font-data text-[11px] uppercase tracking-wide text-ink/45">
                {s.role}
              </p>
            </div>
            {isAdmin && (
              <RemoveButton
                disabled={pending || (s.role === "admin" && adminCount <= 1)}
                label={s.role === "admin" && adminCount <= 1 ? "Only admin" : "Remove"}
                onClick={() => run(() => removeStaffMember(s.userId))}
              />
            )}
          </li>
        ))}
      </ul>

      {!isAdmin ? (
        <p className="text-sm text-ink/45">
          Only an admin can change this list.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addStaffMember(email, role), () => setEmail(""));
          }}
          className="rounded-[var(--radius-card)] border border-ink/15 bg-paper p-5"
        >
          <p className="mb-4 text-sm text-ink-soft">
            The person needs a Supabase Auth account first —{" "}
            <span className="text-ink">Authentication → Users → Add user</span>. Then
            add the same email here.
          </p>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="someone@example.com"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Role" hint="Admins can also change this list">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "host" | "admin")}
                className={inputClass}
              >
                <option value="host">Host</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <button
              type="submit"
              disabled={pending || !email.trim()}
              className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-50"
            >
              {pending ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      )}
    </Panel>
  );
}
