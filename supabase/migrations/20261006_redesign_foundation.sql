-- Redesign foundation (2026-10-06)
-- Safe to run against production while the old frontend is live:
-- every change is additive or a data cleanup the old UI already understands.

begin;

-- 1. Server-side drafts. Existing rows are finished records.
alter table sake_entries
  add column if not exists status text not null default 'published';

alter table sake_entries drop constraint if exists sake_entries_status_check;
alter table sake_entries
  add constraint sake_entries_status_check check (status in ('draft', 'published'));

-- A draft must never leak into 廣場.
alter table sake_entries drop constraint if exists sake_entries_draft_private;
alter table sake_entries
  add constraint sake_entries_draft_private check (status = 'published' or is_public = false);

create index if not exists sake_entries_user_status_idx on sake_entries (user_id, status);

-- 2. New records are private unless the user opts in. Existing rows keep their setting.
alter table sake_entries alter column is_public set default false;

-- 3. Ratings in 0.5 steps (column is already numeric(2,1); integers stay valid).
alter table sake_entries alter column rating type numeric(2,1) using rating::numeric(2,1);
alter table sake_entries drop constraint if exists sake_entries_rating_check;
alter table sake_entries
  add constraint sake_entries_rating_check
  check (rating is null or (rating >= 0.5 and rating <= 5 and rating * 2 = floor(rating * 2)));

-- 4. Type: raw kanji leaked in from label scan / product autofill → canonical sake_tags ids.
update sake_entries e
set type = t.id
from sake_tags t
where t.category = 'type'
  and e.type is not null
  and e.type <> t.id
  and e.type = regexp_replace(t.ja, '（.*）$', '');

update sake_entries set type = null where type = '';

commit;

-- Check afterwards (expect only sake_tags ids or null):
-- select type, count(*) from sake_entries group by 1 order by 2 desc;
