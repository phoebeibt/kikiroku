-- Redesign foundation (2026-10-06, v2)
-- Safe to run against production while the old frontend is live.
-- Each statement stands alone (no wrapping transaction) and is idempotent,
-- so if one fails the rest still apply and the error points at the culprit.
-- Run the whole file in Supabase → SQL Editor.

-- 1. Server-side drafts. Existing rows are finished records.
alter table public.sake_entries add column if not exists status text not null default 'published';

alter table public.sake_entries drop constraint if exists sake_entries_status_check;
alter table public.sake_entries add constraint sake_entries_status_check check (status in ('draft', 'published'));

-- A draft must never leak into 廣場.
alter table public.sake_entries drop constraint if exists sake_entries_draft_private;
alter table public.sake_entries add constraint sake_entries_draft_private check (status = 'published' or is_public = false);

create index if not exists sake_entries_user_status_idx on public.sake_entries (user_id, status);

-- 2. New records are private unless the user opts in. Existing rows keep their setting.
alter table public.sake_entries alter column is_public set default false;

-- 3. Ratings in 0.5 steps. The column is already numeric(2,1), so only the check changes.
alter table public.sake_entries drop constraint if exists sake_entries_rating_check;
alter table public.sake_entries add constraint sake_entries_rating_check
  check (rating is null or (rating >= 0.5 and rating <= 5 and rating * 2 = floor(rating * 2)));

-- 4. Type: raw kanji → canonical sake_tags ids.
update public.sake_entries set type = 'junmai-ginjo'    where type = '純米吟醸';
update public.sake_entries set type = 'junmai-daiginjo' where type = '純米大吟醸';
update public.sake_entries set type = 'junmai'          where type = '純米';
update public.sake_entries set type = null              where type = '';

-- 5. Make the API see the new column immediately.
notify pgrst, 'reload schema';

-- Check (expect a status column, and only ids or null in type):
select type, status, count(*) from public.sake_entries group by 1, 2 order by 3 desc;
