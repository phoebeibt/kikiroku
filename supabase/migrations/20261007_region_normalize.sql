-- 2026-10-07 産地: fold variant prefecture spellings ("高知", "高知縣") into the official name
-- stored in sake_areas ("高知県"). The app now normalises on save; this fixes older rows.
-- Safe to re-run.

with pref as (
  select name,
         case when name = '北海道' then name else regexp_replace(name, '[都道府県]$', '') end as bare
  from public.sake_areas
  where name <> 'その他'
)
update public.sake_entries e
   set region = p.name
  from pref p
 where e.region is not null
   and e.region <> p.name
   and (trim(replace(e.region, '縣', '県')) = p.name or trim(e.region) = p.bare);

with pref as (
  select name,
         case when name = '北海道' then name else regexp_replace(name, '[都道府県]$', '') end as bare
  from public.sake_areas
  where name <> 'その他'
)
update public.sake_products s
   set region = p.name
  from pref p
 where s.region is not null
   and s.region <> p.name
   and (trim(replace(s.region, '縣', '県')) = p.name or trim(s.region) = p.bare);

-- Report: any regions left that are not one of the 47 (should be empty or clearly non-prefecture)
select 'entries' as tbl, region, count(*) from public.sake_entries
 where region is not null and region not in (select name from public.sake_areas) group by region
union all
select 'products', region, count(*) from public.sake_products
 where region is not null and region not in (select name from public.sake_areas) group by region
order by 1, 3 desc;
