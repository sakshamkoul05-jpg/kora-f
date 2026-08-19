-- Seed the six rooms.
--
-- Mirrors lib/rooms.ts, which stays the source of truth for the marketing
-- pages. Idempotent, so re-running a migration set is safe.
--
-- Rates are deliberately NULL. Nobody has confirmed them, and a placeholder
-- number in the database is exactly how a wrong price ends up quoted to a
-- guest. The site renders "Rate on request" while these are null.
--
-- Numbering is the hosts': facing the building, the rightmost upstairs room is
-- Room 1 and the leftmost is Room 5; the ground-floor room is Room 6.

insert into public.rooms (slug, room_number, name, floor, has_kitchenette, sort_order)
values
  ('zangskar',    1, 'Zangskar',    'First',  true,  1),
  ('deodar',      2, 'Deodar',      'First',  true,  2),
  ('chorten',     3, 'Chorten',     'First',  false, 3),
  ('dhauladhar',  4, 'Dhauladhar',  'First',  false, 4),
  ('butter-lamp', 5, 'Butter Lamp', 'First',  false, 5),
  ('mani',        6, 'Mani',        'Ground', false, 6)
on conflict (slug) do update
set room_number     = excluded.room_number,
    name            = excluded.name,
    floor           = excluded.floor,
    has_kitchenette = excluded.has_kitchenette,
    sort_order      = excluded.sort_order;
