-- Phase 2·B: Add name_zh / name_en columns to sake_brands + sake_breweries.
-- Run in Supabase SQL Editor.
--
-- Purpose:
-- - name_zh: for cases where Chinese has different written form
--   (simplified variants, official Chinese trademark). Most rows leave empty.
-- - name_en: for official English trademark or fallback to romaji-style form.
-- - Reading (pronunciation) still lives in furigana + romaji columns,
--   never in these new columns. Reading rule: always use romaji, never pinyin.

ALTER TABLE sake_breweries
  ADD COLUMN IF NOT EXISTS name_zh text,
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE sake_brands
  ADD COLUMN IF NOT EXISTS name_zh text,
  ADD COLUMN IF NOT EXISTS name_en text;

-- Optional indexes for autocomplete search (only useful once data is filled).
-- Using text_pattern_ops for prefix matching efficiency; add only if needed.
CREATE INDEX IF NOT EXISTS sake_breweries_name_zh_idx ON sake_breweries(name_zh) WHERE name_zh IS NOT NULL;
CREATE INDEX IF NOT EXISTS sake_breweries_name_en_idx ON sake_breweries(name_en) WHERE name_en IS NOT NULL;
CREATE INDEX IF NOT EXISTS sake_brands_name_zh_idx    ON sake_brands(name_zh)    WHERE name_zh IS NOT NULL;
CREATE INDEX IF NOT EXISTS sake_brands_name_en_idx    ON sake_brands(name_en)    WHERE name_en IS NOT NULL;

-- Verification: expect all 4 columns to exist, all NULL
SELECT
  (SELECT COUNT(*) FROM sake_breweries WHERE name_zh IS NOT NULL) AS breweries_zh_filled,
  (SELECT COUNT(*) FROM sake_breweries WHERE name_en IS NOT NULL) AS breweries_en_filled,
  (SELECT COUNT(*) FROM sake_brands    WHERE name_zh IS NOT NULL) AS brands_zh_filled,
  (SELECT COUNT(*) FROM sake_brands    WHERE name_en IS NOT NULL) AS brands_en_filled;
