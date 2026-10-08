-- 2026-10-08 飲みたい: a wish points at the 事典 product (sake_products). The 酒札 it was saved
-- from (entry_id) is only its source, so the wish survives when that 酒札 is deleted or made
-- private. Adds ★優先 (priority) and a one-line メモ (note). Safe to re-run.

alter table public.sake_wishes
  add column if not exists product_id uuid references public.sake_products(id) on delete cascade,
  add column if not exists priority   boolean not null default false,
  add column if not exists note       text;

alter table public.sake_wishes alter column entry_id drop not null;

-- The source 酒札 may go away; the wish stays.
do $$
declare c text;
begin
  for c in
    select con.conname from pg_constraint con
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
     where con.conrelid = 'public.sake_wishes'::regclass and con.contype = 'f' and a.attname = 'entry_id'
  loop
    execute format('alter table public.sake_wishes drop constraint %I', c);
  end loop;
end $$;
alter table public.sake_wishes
  add constraint sake_wishes_entry_id_fkey foreign key (entry_id)
  references public.sake_entries(id) on delete set null;

-- Backfill ① 酒札 already linked to the catalogue.
update public.sake_wishes w
   set product_id = e.product_id
  from public.sake_entries e
 where w.entry_id = e.id and w.product_id is null and e.product_id is not null;

-- ② Same full name in the catalogue (what the app does when a 酒札 is saved).
update public.sake_wishes w
   set product_id = p.id
  from public.sake_entries e, lateral (
         select id from public.sake_products
          where lower(name) = lower(trim(concat_ws(' ', nullif(e.brand, ''), e.name)))
          limit 1) p
 where w.entry_id = e.id and w.product_id is null;

-- ③ Still none: add the sake to the catalogue from the 酒札, as the app does for new records.
--   (The catalogue keeps 酒の種類 in kanji; 酒札 keep the tag id.)
with need as (
  select distinct on (lower(trim(concat_ws(' ', nullif(e.brand, ''), e.name))))
         trim(concat_ws(' ', nullif(e.brand, ''), e.name)) as full_name, e.*
    from public.sake_wishes w join public.sake_entries e on e.id = w.entry_id
   where w.product_id is null and coalesce(e.name, '') <> ''
)
insert into public.sake_products (name, brewery_name, region, type, rice, yeast, polishing, alcohol, smv, acidity)
select full_name, nullif(brewery, ''), nullif(region, ''),
       case type when 'junmai' then '純米' when 'tokubetsu-junmai' then '特別純米' when 'junmai-ginjo' then '純米吟醸'
                 when 'junmai-daiginjo' then '純米大吟醸' when 'honjozo' then '本醸造' when 'tokubetsu-honjozo' then '特別本醸造'
                 when 'ginjo' then '吟醸' when 'daiginjo' then '大吟醸' when 'futsushu' then '普通酒' else null end, nullif(rice, ''), nullif(yeast, ''),
       nullif(regexp_replace(polishing::text, '[^0-9.]', '', 'g'), '')::numeric,
       nullif(regexp_replace(alcohol::text,   '[^0-9.]', '', 'g'), '')::numeric,
       nullif(smv::text, ''),
       nullif(regexp_replace(acidity::text,   '[^0-9.]', '', 'g'), '')::numeric
  from need;

update public.sake_wishes w
   set product_id = p.id
  from public.sake_entries e, lateral (
         select id from public.sake_products
          where lower(name) = lower(trim(concat_ws(' ', nullif(e.brand, ''), e.name)))
          limit 1) p
 where w.entry_id = e.id and w.product_id is null;

-- Link those 酒札 too, so みんなの瓶身 finds them.
update public.sake_entries e
   set product_id = w.product_id
  from public.sake_wishes w
 where w.entry_id = e.id and e.product_id is null and w.product_id is not null;

-- One wish per sake per person (keep the oldest if the backfill made duplicates).
delete from public.sake_wishes w
 using public.sake_wishes o
 where w.user_id = o.user_id and w.product_id = o.product_id
   and (o.created_at, o.id::text) < (w.created_at, w.id::text);
create unique index if not exists sake_wishes_user_product_key
  on public.sake_wishes (user_id, product_id) where product_id is not null;

alter table public.sake_wishes drop constraint if exists sake_wishes_target_chk;
alter table public.sake_wishes
  add constraint sake_wishes_target_chk check (entry_id is not null or product_id is not null);

-- ★優先 and メモ are edited in place.
drop policy if exists "wishes_update_own" on public.sake_wishes;
create policy "wishes_update_own" on public.sake_wishes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Report
select count(*) as wishes,
       count(*) filter (where product_id is not null) as with_product,
       count(*) filter (where entry_id is null) as without_entry
  from public.sake_wishes;
