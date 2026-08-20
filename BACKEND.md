# Backend — Supabase

Booking requests, availability, and a host view for triaging them.

**What is proven, and what is not.**

`npm run test:db` applies `supabase/setup.sql` to a real Postgres 16 (PGlite,
in-process — no Docker, no cloud) and exercises it: 21 checks covering the
triggers, every check constraint, the exclusion constraint, and the
availability functions. So the schema definitely applies and the
double-booking guarantee definitely bites.

**The RLS policies are not covered by that.** PGlite runs everything as
superuser, and superusers bypass row security — so the policies are proven to
*parse*, not to grant the right things to the right roles. Nor has any request
made a real HTTP round trip through PostgREST and Supabase Auth. Those need a
live project; there is a short manual check for them at the bottom of this
file.

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

### 3. Run the migrations

**Easiest:** open `supabase/setup.sql`, copy all of it, paste into the Supabase
SQL editor, Run. That file is the five migrations concatenated in order.

Run it **once**, on a fresh project — it is not re-runnable, and its header
explains how to reset if a run half-fails.

Or run the five files individually, or `supabase db push` if you link the
project. Order matters either way — later files depend on earlier ones.

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

## Deployment (Vercel)

Live at **https://kora-front-seven.vercel.app** — Vercel project `kora-front`
under `sakshamkoul05-jpgs-projects`. Note that the GitHub repo is `kora-f` but
the Vercel project is `kora-front`; the similarly-named `kora-f` Vercel project
is an old client-questions page and is **not** this site.

Deploys are manual from the CLI, not triggered by pushing to GitHub:

```bash
npx vercel --prod
```

Pushing to `main` alone does **not** update the live site.

Three environment variables are set for Production and Development:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`NEXT_PUBLIC_SITE_URL`. Preview has none — `main` is the production branch, so
Vercel refuses to attach Preview variables to it, and no other branches exist.
Create a branch and they will need adding.

### When a real domain is ready

`NEXT_PUBLIC_SITE_URL` currently points at the `.vercel.app` address, so every
canonical tag, the sitemap, `robots.txt` and all OpenGraph images resolve there.
Change it in Vercel and redeploy at the same time as pointing the domain, or
the site will advertise the wrong address to search engines. The placeholder
`korahouse.com` in `lib/seo.ts` is only a fallback for when the variable is
unset.

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

```bash
npm run test:db
```

21 checks against a real Postgres 16, in-process via PGlite. It applies
`setup.sql` exactly as you would paste it, then proves the behaviour: the
reference trigger, the trigger that stops a crafted insert self-confirming,
each check constraint, the exclusion constraint (including that a check-out
day frees the room and that a declined stay releases it), and availability
including site-wide blocks. Run it after any change to a migration.

### If local dev cannot reach Supabase

`TypeError: fetch failed` with cause `UNABLE_TO_VERIFY_LEAF_SIGNATURE` is not
an application error. Some antivirus products (Avast, Kaspersky, ESET) and most
corporate proxies intercept HTTPS and re-sign certificates with their own root,
which Node does not trust by default. They usually set `NODE_EXTRA_CA_CERTS`
system-wide to compensate — so `npm run dev` in a normal terminal works, while
anything launched from a process that did not inherit that variable fails.

Check it with `echo $NODE_EXTRA_CA_CERTS`. If it is set, start the dev server
from a shell that has it. Nothing needs changing in the code, and deployed
environments are unaffected.

### The one check that needs a live project

RLS is the security boundary and the harness above cannot test it, because
PGlite runs as superuser. Once you are set up, confirm it directly — in the SQL
editor:

```sql
set local role anon;
select * from public.booking_requests;   -- must return 0 rows, not an error
reset role;
```

Zero rows is correct and is the whole design: anon can insert a request but can
never read one back. If that returns actual bookings, stop and check that
`20260819120100_rls.sql` ran.
