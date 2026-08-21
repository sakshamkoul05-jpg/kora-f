-- Rates: ₹2,000 a night, every room.
--
-- Until now every base_rate_inr was null, so the site said "price on request"
-- on all six rooms and a host typed a figure by hand on every acceptance. The
-- hosts have set a flat opening rate; seasonal variation can go in
-- rate_overrides later without touching this.
--
-- Safe to re-run. Only fills rooms that have no rate, so a rate changed later
-- in /admin is never clobbered by re-applying this file.

update public.rooms
   set base_rate_inr = 2000
 where base_rate_inr is null;

-- What the site will now quote: 3 nights = ₹6,000, deposit ₹1,500 at 25%,
-- ₹4,500 on arrival.
select
  name,
  base_rate_inr as nightly,
  base_rate_inr * 3 as three_nights,
  round(base_rate_inr * 3 * (select deposit_percent from public.settings) / 100.0) as deposit
from public.rooms
order by sort_order;
