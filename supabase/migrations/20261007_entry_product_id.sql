-- 2026-10-07 事典: link each 酒札 to its catalogue row (sake_products), so
-- みんなの瓶身 / あなたの記録 on a 酒款 page no longer depend on fuzzy name matching.
-- Safe to re-run.

alter table public.sake_entries
  add column if not exists product_id uuid references public.sake_products(id) on delete set null;

create index if not exists sake_entries_product_id_idx on public.sake_entries (product_id);

-- Backfill: same brewery and the same name once spaces / 中黒 / case are ignored.
-- Only unambiguous matches (exactly one catalogue row) are linked; the rest stay null
-- and the app keeps using its name-matching fallback for them.
with norm as (
  select e.id as entry_id,
         lower(regexp_replace(coalesce(e.brand, '') || coalesce(e.name, ''), '[[:space:]　・･]', '', 'g')) as full_name,
         lower(regexp_replace(coalesce(e.name, ''), '[[:space:]　・･]', '', 'g')) as bare_name,
         e.brewery
  from public.sake_entries e
  where e.product_id is null and coalesce(e.name, '') <> ''
),
cand as (
  select n.entry_id, p.id as product_id
  from norm n
  join public.sake_products p
    on p.brewery_name = n.brewery
   and lower(regexp_replace(replace(p.name, '火入れ', '火入'), '[[:space:]　・･]', '', 'g'))
       in (replace(n.full_name, '火入れ', '火入'), replace(n.bare_name, '火入れ', '火入'))
),
uniq as (
  select entry_id, min(product_id::text)::uuid as product_id
  from cand group by entry_id having count(*) = 1
)
update public.sake_entries e
   set product_id = u.product_id
  from uniq u
 where e.id = u.entry_id;

-- Report
select count(*) filter (where product_id is not null) as linked,
       count(*) as total
  from public.sake_entries;
