# Backend — Supabase

Booking requests, availability, and a host view for triaging them.

**Nothing here is live yet.** No Supabase project was reachable from the build
environment, so the SQL has never been executed and no request has ever made a
round trip. Everything below is written to run, and the pure logic is unit
tested, but the first person to follow these steps is also the first person to
prove them. Expect to hit at least one thing.

---

## Two decisions that shaped the design

**1. It is a request system, not instant booking.** The hosts' own words: *"Before
accepting a booking, we like to interact with guests to ensure our home is the
right fit."* So a guest submits a request; it lands as `pending`; a host decides.
Nothing a guest can do reserves a room. This is enforced in the database, not
just the UI — a `BEFORE INSERT` trigger forces `status='pending'` and strips the
host-only columns, so a hand-crafted POST cannot self-confirm.

**2. There is no payment flow, deliberately.** Every `nightlyRate` is still
`null` — no rate has been confirmed for any room. There is no amount to charge,
so Razorpay is not wired up. `rooms.base_rate_inr` and
`booking_requests.quoted_total_inr` exist so a host can record a quote, but the
site never computes or displays a price. **Confirm the rates before asking for
payments.**

---

## Setup

### 1. Create the project

Supabase → new project. Note the URL and the `anon` key from Project Settings →
API.

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

The anon key is *meant* to be public — it ships in the JS bundle. It is only
safe because Row Level Security constrains it, so **never disable RLS on a
table this key can reach**.

Set `NEXT_PUBLIC_SITE_URL` too, or canonical URLs and OpenGraph tags point at
the placeholder domain.

### 3. Run the migrations, in order

Paste each into the Supabase SQL editor, or `supabase db push` if you link the
project. Order matters — later files depend on earlier ones.

| # | File | What it does |
|---|---|---|
| 1 | `20260819120000_init.sql` | rooms, booking_requests, blocked_dates |
| 2 | `20260819120050_staff.sql` | the staff allow-list and `is_staff()` |
| 3 | `20260819120100_rls.sql` | Row Level Security policies |
| 4 | `20260819120200_availability.sql` | availability functions |
| 5 | `20260819120300_seed_rooms.sql` | the six rooms |

### 4. Create the host accounts

Supabase → Authentication → Users → add a user for each host.

### 5. Make them staff — **this step is not optional**

```sql
insert into public.staff (user_id, email, role)
select id, email, 'admin' from auth.users where email = 'rohitash@example.com';
```

Until a row exists in `staff`, **nobody can read a booking request** — including
you. That is the intended default: closed, not open. If `/admin` shows an empty
list, this is almost certainly why, and the page tells you so.

### 6. Turn off public sign-up

Authentication → Providers → Email → disable "Enable sign ups".

The site never asks a guest to register, so nothing needs it. Leaving it on
means a stranger can create an account — they still could not read anything
without a `staff` row, but there is no reason to allow it.

---

## How it fits together

```
Guest  →  /book  →  POST /api/booking-requests  →  Supabase (anon key + RLS)
                       validate · honeypot · rate limit
                                                        ↓ status = pending
Host   →  /admin (Supabase Auth)  →  confirm / decline
                                                        ↓ status = confirmed
                                     room is held; overlaps become impossible
```

- `GET /api/availability?from=&to=` — which rooms are free. Only *confirmed*
  requests hold a room, so speculative requests can't lock the calendar.
- `/admin` — host view. Bare layout: **no animation**, per the build spec.

## Security notes

- **RLS is the security boundary.** `proxy.ts` redirects anonymous visitors away
  from `/admin`, but that is convenience. The real gate is `is_staff()` in the
  database, and it holds even if the proxy is bypassed or removed. Never move a
  permission check out of the database into application code.
- **Anon can INSERT a booking request and nothing else.** There is deliberately
  no `SELECT` policy for anonymous users — not even for "their own" row, since
  an unauthenticated caller's claim to a row is unverifiable. Adding one would
  expose every guest's name, email and phone. The reference is returned in the
  insert response instead.
- **Double-booking is prevented by the database**, not by application code. A
  GiST exclusion constraint makes two overlapping *confirmed* stays for the same
  room physically impossible, so two hosts confirming at the same moment cannot
  race. The admin surfaces that as a readable message rather than an error.
- **Date ranges are half-open** (`[)`): a stay ending on the 5th does not clash
  with one starting on the 5th. Unit tested in `lib/booking.test.ts`.
- **The service role key is not used anywhere.** It bypasses RLS entirely. If
  you ever add it, server-side only, and never with a `NEXT_PUBLIC_` prefix.

## Rate limiting — an honest limitation

`lib/rate-limit.ts` is in-memory and therefore per-instance. On a serverless or
scaled deployment each instance keeps its own counter and a cold start resets
it, so the effective limit is (limit × instances). It is a speed bump, not a
guarantee. For a six-room guesthouse that is proportionate; if it ever needs to
be real, move the counter to Postgres or Upstash rather than raising the number.

## Without Supabase configured

The site is built to work with no backend at all: marketing pages render
normally, `/api/availability` returns `configured: false` with a 200, the
booking form degrades to a clear message plus the WhatsApp link, and `/admin`
says it isn't configured. That is deliberate — the marketing site should not be
hostage to a missing environment variable.

## Not built yet

- **Payments.** Blocked on confirmed rates, not on effort.
- **Emails.** Confirming a request does *not* email the guest; the admin says so
  in as many words. Wire up Resend or Supabase Auth hooks when the hosts want it.
- **Guest accounts / "my bookings".** Step 6 of the build spec also mentions
  these; not needed for a request-based flow.
- **Blocked dates UI.** The `blocked_dates` table and its RLS exist; add rows by
  SQL for now.

## Testing

```bash
npm test
```

29 tests over the date and validation logic — half-open overlap, timezone-safe
parsing, impossible calendar dates, the honeypot, and the guest-count bounds.
The database logic itself is untested, for the reason at the top of this file.
