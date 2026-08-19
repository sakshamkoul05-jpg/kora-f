-- Row Level Security.
--
-- The threat to keep in mind: `booking_requests` holds guests' names, emails
-- and phone numbers. Supabase exposes PostgREST directly to the browser with
-- the anon key, so any table left readable is readable BY EVERYONE — the anon
-- key is public by design and is in the JS bundle. RLS is the only thing
-- standing between an anonymous visitor and every guest's contact details.
--
-- Rules:
--   rooms            public read (the site needs it), staff write
--   blocked_dates    public read of the DATES only, via a view; staff write
--   booking_requests anon may INSERT and nothing else. No anon SELECT at all,
--                    not even of their own row — "their own" is unauthenticated
--                    and therefore unverifiable. The confirmation reference is
--                    returned by the API in the insert response instead.

alter table public.rooms            enable row level security;
alter table public.booking_requests enable row level security;
alter table public.blocked_dates    enable row level security;

-- Anything not matched by a policy is denied, so there is no default-allow.

-- ----------------------------------------------------------------- rooms ----

create policy "rooms are publicly readable"
  on public.rooms for select
  to anon, authenticated
  using (is_active);

create policy "staff manage rooms"
  on public.rooms for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ------------------------------------------------------- booking requests ----

-- A visitor may lodge a request. They may not read, edit or delete anything.
-- The BEFORE INSERT triggers force status='pending' and clear host-only
-- columns, so a crafted payload cannot self-confirm or inject a host note.
create policy "anyone may submit a booking request"
  on public.booking_requests for insert
  to anon, authenticated
  with check (
    check_out > check_in
    and check_out - check_in <= 90
    -- No requests for dates already gone.
    and check_in >= current_date
    -- No requests absurdly far out.
    and check_in <= current_date + interval '2 years'
  );

-- Deliberately NO select policy for anon. Do not add one.

create policy "staff read booking requests"
  on public.booking_requests for select
  to authenticated
  using (public.is_staff());

create policy "staff update booking requests"
  on public.booking_requests for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff delete booking requests"
  on public.booking_requests for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------- blocked dates ----

create policy "staff manage blocked dates"
  on public.blocked_dates for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Blocked dates are not public directly — a reason like "family staying" is
-- nobody's business. Availability is exposed through the function below, which
-- returns dates only.
