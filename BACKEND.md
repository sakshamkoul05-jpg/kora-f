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

**2. Money moves only after a host says yes.** The guest browses priced rooms
like any booking site, but sending a request charges nothing. A host accepts,
which quotes the stay and holds the room on a clock; the guest then pays a
deposit to keep it. Declining therefore costs nothing and needs no refund —
which is what makes it safe to actually vet guests rather than vet them
theoretically.

The states, in `booking_status`:

| state | holds the room? | meaning |
|---|---|---|
| `pending` | no | guest asked. Several people may ask for the same dates. |
| `accepted` | **yes, on a clock** | host said yes and quoted. Awaiting deposit. |
| `confirmed` | yes | deposit received. The stay is real. |
| `expired` | no | nobody paid in time. Room released automatically. |
| `declined` | no | host said no. Nothing was ever charged. |
| `cancelled` | no | called off after confirmation. Refund is a human decision. |

**Rates are still unset.** Every `base_rate_inr` is `null`, so the site says
"price on request" and a host types a figure when accepting. Set them in
`/admin` → *Rates and rules* and prices appear immediately — no deploy needed.

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
| 6 | `20260820100000_submit_booking_request.sql` | the submit RPC (see below) |
| 7 | `20260821090000_booking_v2.sql` | accepted/expired states, pricing, payments |

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

## Content-Security-Policy

Built in `proxy.ts` from `lib/csp.ts`, because a nonce has to be generated per
request. There are two policies, and the reason is worth knowing before anyone
tries to "fix" it into one:

**A nonce cannot exist on a static page.** It is baked at build time, when
there is no request to generate one for. The marketing pages are all static;
forcing 22 of them dynamic to earn a nonce would trade away static rendering
and CDN caching to defend pages that render no user input.

So `/admin/*` and `/book/*` — already dynamic, and the only places that touch
credentials or guest data — get a real nonce with `'strict-dynamic'`. Every
other page gets a policy without one, which still forbids loading script from
another origin, framing, `base-uri` hijacking, and posting a form anywhere but
back here.

What must never happen is `'unsafe-inline'` *beside* a nonce: modern browsers
ignore `'unsafe-inline'` when a nonce is present, so it looks permissive and
does nothing — while on a policy with no nonce it is the thing making the page
work. Two policies, kept apart, is the honest version.

`style-src` allows `'unsafe-inline'` in both. React's `style={{}}` compiles to
inline style attributes, which CSP3 blocks under `style-src`, and they are
throughout the codebase. An inline style cannot exfiltrate data the way an
inline script can.

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

## Razorpay

Three server-only variables, all listed in `.env.example`. **None may ever
carry a `NEXT_PUBLIC_` prefix** — the key secret signs payment requests and the
webhook secret authenticates incoming payment events, so either one in the
browser bundle is a total compromise.

```
RAZORPAY_KEY_ID          Dashboard → Settings → API Keys
RAZORPAY_KEY_SECRET      issued with the key id, shown once
RAZORPAY_WEBHOOK_SECRET  you choose this when creating the webhook
SUPABASE_SERVICE_ROLE_KEY  required — see below
```

Create the webhook at **Settings → Webhooks**, pointing at
`https://your-domain/api/razorpay/webhook`, subscribed to `payment_link.paid`,
`payment.captured` and `payment.failed`.

**Without the keys the site still works.** Accepting holds the room and the
host sends payment details themselves. Links start appearing the moment the
keys are added; nothing else changes.

### Why the webhook needs the service role key

It arrives with no user session, so it has no RLS identity — and marking a
booking paid cannot be granted to `anon`, because that would hand it to anyone
who can guess a reference. So the webhook, and only the webhook, uses the
service-role key.

That is safe **because it verifies an HMAC signature over the raw body before
touching the database**, and only because of that. The order in
`app/api/razorpay/webhook/route.ts` is load-bearing: read raw bytes, verify,
then act. Never move database work above the signature check, and never parse
and re-serialise the body first — that changes the bytes and the signature can
never match.

Payment **links** rather than an embedded checkout, deliberately: the guest is
paying after a conversation, often hours later, probably from a WhatsApp
message on a phone. A link survives that; an embedded checkout does not.

## Not built yet

- **Emails.** Accepting does *not* email the guest — the admin says so and gives
  you a WhatsApp button with the link pre-written. Wire up Resend when the hosts
  want it automated.
- **Refunds.** Cancelling a confirmed booking does not refund the deposit;
  that is a human decision, made in the Razorpay dashboard.
- **Seasonal rates UI.** The `rate_overrides` table, its priority resolution and
  its tests all exist and the pricing engine uses them, but rows are added by
  SQL for now. The standing per-room rate is editable in `/admin`.
- **Guest self-service.** No "my bookings" page. A guest has their reference and
  the hosts' WhatsApp, which for six rooms is enough.
- **Blocked dates UI.** The table and its RLS exist; add rows by SQL.

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
