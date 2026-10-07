-- Bottle crop + list thumbnails (2026-10-07)
-- Additive only; safe while the current site is live. Run in Supabase → SQL Editor.

-- Manual alignment of the main photo to the standard bottle template.
-- Shape: { "x": 0, "y": 0, "scale": 1.5, "rotation": 0, "maskType": "standard" }
--   x / y     translate as % of the template box
--   scale     zoom relative to cover-fit
--   rotation  degrees
alter table public.sake_entries add column if not exists photo_crop jsonb;

-- ~200px-wide copy of photo_url for lists (the original stays untouched).
alter table public.sake_entries add column if not exists thumb_url text;

notify pgrst, 'reload schema';

-- Check:
select count(*) filter (where photo_url is not null) as photos,
       count(*) filter (where thumb_url is not null) as thumbs
from public.sake_entries;
