-- Running the house from the panel.
--
-- Three things here, all of which existed only as SQL before and therefore in
-- practice did not exist at all.

-- ------------------------------------------- a host may enter a booking ----
--
-- force_pending_on_insert() exists to stop a GUEST submitting a booking that
-- is already accepted and paid. Applied to hosts it stops something else
-- entirely: recording the phone call that just came in.
--
-- Most bookings for this house arrive by WhatsApp. Until a host can enter one,
-- the calendar is wrong, and the availability the website shows to strangers
-- is a lie built on it.
--
-- So the trigger now trusts staff. is_staff() reads auth.uid(), which is null
-- for an anonymous insert through PostgREST and non-null only for a signed-in
-- host — and it is SECURITY DEFINER, so it does not re-enter RLS from inside
-- the trigger. A guest is constrained exactly as before.
create or replace function public.force_pending_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.coupon_code := nullif(upper(btrim(coalesce(new.coupon_code, ''))), '');

  if public.is_staff() then
    -- A host is already trusted to change any of these fields a second later
    -- with an UPDATE. Refusing them at INSERT would only be theatre.
    return new;
  end if;

  new.status          := 'pending';
  new.host_note       := null;
  new.quoted_total_inr := null;
  new.accepted_at     := null;
  new.hold_expires_at := null;
  new.decided_by      := null;
  new.nightly_rates   := null;
  new.subtotal_inr    := null;
  new.tax_inr         := null;
  new.total_inr       := null;
  new.deposit_inr     := null;
  new.deposit_paid_at := null;
  new.discount_inr    := null;
  return new;
end;
$$;

-- Where a booking came from, so a host can tell a website request from a
-- phone call at a glance and see which channel is actually working.
alter table public.booking_requests
  drop constraint if exists booking_source_known;
alter table public.booking_requests
  add constraint booking_source_known
  check (source in ('website', 'phone', 'whatsapp', 'walk-in', 'email', 'other'));

-- ----------------------------------------------------- editable site copy ---
--
-- Small, typed, key/value. A phone number changing should not need a developer
-- and a deploy — and it is exactly the sort of change that gets made at 9pm by
-- whoever is holding the phone.
create table if not exists public.site_content (
  key         text primary key,
  value       text not null default '',
  label       text not null,
  hint        text,
  -- 'text' renders a single line, 'multiline' a textarea. Nothing else, on
  -- purpose: the moment this grows a rich text editor it becomes a CMS and
  -- somebody pastes styled Word markup into the homepage.
  kind        text not null default 'text' check (kind in ('text', 'multiline')),
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

insert into public.site_content (key, label, hint, kind, sort_order, value) values
  ('contact_phone',    'Phone number',      'Shown on the site and used for the WhatsApp link', 'text', 10, '+91 94180 66891'),
  ('contact_email',    'Email address',     'Where guests are told to write',                   'text', 20, ''),
  ('address_line',     'Address',           'Shown on Getting Here and in search results',      'text', 30, ''),
  ('checkin_window',   'Check-in time',     'e.g. "After 1pm"',                                 'text', 40, ''),
  ('checkout_window',  'Check-out time',    'e.g. "By 11am"',                                   'text', 50, ''),
  ('booking_intro',    'Booking page note', 'The paragraph explaining how booking works here',  'multiline', 60, ''),
  ('house_rules',      'House rules',       'Shown before a guest commits',                     'multiline', 70, '')
on conflict (key) do nothing;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "site content is public" on public.site_content;
create policy "site content is public"
  on public.site_content for select to anon, authenticated using (true);

drop policy if exists "staff edit site content" on public.site_content;
create policy "staff edit site content"
  on public.site_content for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------------------ FAQs ----

create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (length(btrim(question)) between 3 and 300),
  answer     text not null check (length(btrim(answer)) between 3 and 3000),
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.faqs enable row level security;

drop policy if exists "faqs are public" on public.faqs;
create policy "faqs are public"
  on public.faqs for select to anon, authenticated using (is_active);

drop policy if exists "staff manage faqs" on public.faqs;
create policy "staff manage faqs"
  on public.faqs for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------- guest directory ----
--
-- Derived, not stored. A guests table would be a second copy of the same
-- people, and the copy would drift the first time someone corrected a spelling
-- on a booking. Email is the key because it is the one field that is always
-- present and always the same person.
create or replace function public.guest_directory()
returns table (
  guest_email    text,
  guest_name     text,
  guest_phone    text,
  guest_country  text,
  stays          int,
  requests       int,
  nights         int,
  spend_inr      int,
  first_seen     timestamptz,
  last_checkout  date
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    b.guest_email,
    -- The most recent spelling wins; people correct their own name.
    (array_agg(b.guest_name order by b.created_at desc))[1] as guest_name,
    (array_agg(b.guest_phone order by b.created_at desc)
       filter (where b.guest_phone is not null))[1] as guest_phone,
    (array_agg(b.guest_country order by b.created_at desc)
       filter (where b.guest_country is not null))[1] as guest_country,
    count(*) filter (where b.status = 'confirmed')::int as stays,
    count(*)::int as requests,
    coalesce(sum((b.check_out - b.check_in)) filter (where b.status = 'confirmed'), 0)::int as nights,
    coalesce(sum(b.total_inr) filter (where b.status = 'confirmed'), 0)::int as spend_inr,
    min(b.created_at) as first_seen,
    max(b.check_out) filter (where b.status = 'confirmed') as last_checkout
  from public.booking_requests b
  group by b.guest_email
  order by max(b.created_at) desc;
$$;

grant execute on function public.guest_directory() to authenticated;
