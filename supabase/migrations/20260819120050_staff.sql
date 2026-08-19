-- Who counts as staff.
--
-- Kept as an explicit allow-list table rather than "any authenticated user",
-- because Supabase projects usually have public sign-up enabled by default —
-- and if `authenticated` alone granted host powers, anyone who registered an
-- account could read every guest's contact details and confirm their own
-- booking. Membership of this table is the gate.

create table public.staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'host' check (role in ('host', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

-- SECURITY DEFINER so the check itself isn't subject to RLS on `staff`
-- (which would recurse). search_path is pinned — without it, a user-created
-- schema earlier on the path could shadow `staff` and spoof the answer.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.staff s where s.user_id = auth.uid()
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- Staff can see who else is staff; only admins can change the list.
create policy "staff read staff"
  on public.staff for select
  to authenticated
  using (public.is_staff());

create policy "admins manage staff"
  on public.staff for all
  to authenticated
  using (
    exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'admin')
  )
  with check (
    exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'admin')
  );

-- SETUP: after creating the first host account in Supabase Auth, run once —
--   insert into public.staff (user_id, email, role)
--   select id, email, 'admin' from auth.users where email = 'you@example.com';
-- Until a row exists here, nobody can read booking requests. That is the
-- intended default: closed, not open.
