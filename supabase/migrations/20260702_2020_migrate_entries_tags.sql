-- Phase 3 Step 3.5: Migrate historical sake_entries data to new tag schema.
-- Run in Supabase SQL Editor AFTER 20260702_2000 (create table) + 20260702_2010 (seed).
--
-- What this does:
-- 1. Adds sake_entries.method_tags column (new tag category)
-- 2. Remaps renamed tag ids (aroma sweet-aroma→honey, ginjo→ginjo-aroma, ...)
-- 3. Deletes removed tag ids (fresh, mild, warm, restaurant, anniversary)
-- 4. Cross-migrates aroma elegant → taste refined, aroma rich-aroma → taste full-body
-- 5. Cross-migrates flavor nama/nigori/koshu → method
-- 6. Handles kijoshu: type='貴醸酒' → type=NULL + method_tags += 'kijoshu'
-- 7. Kanji type ids → romaji (純米 → junmai, etc.)
-- 8. Bonus: 3 obvious Japanese free-form → tag id remaps (生酒/新酒/季節限定)

BEGIN;

-- ============================================================
-- 0. Schema: add method_tags column
-- ============================================================
ALTER TABLE sake_entries ADD COLUMN IF NOT EXISTS method_tags text[] DEFAULT '{}';

-- ============================================================
-- 1. Aroma id remaps (rename in place)
-- ============================================================
UPDATE sake_entries SET aroma_tags = array_replace(aroma_tags, 'sweet-aroma', 'honey')
  WHERE 'sweet-aroma' = ANY(aroma_tags);
UPDATE sake_entries SET aroma_tags = array_replace(aroma_tags, 'ginjo', 'ginjo-aroma')
  WHERE 'ginjo' = ANY(aroma_tags);

-- ============================================================
-- 2. Aroma removals (deleted tags)
-- ============================================================
UPDATE sake_entries SET aroma_tags = array_remove(aroma_tags, 'fresh')
  WHERE 'fresh' = ANY(aroma_tags);
UPDATE sake_entries SET aroma_tags = array_remove(aroma_tags, 'mild')
  WHERE 'mild' = ANY(aroma_tags);

-- ============================================================
-- 3. Cross-migrate aroma → taste (elegant → refined, rich-aroma → full-body)
-- ============================================================
UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'refined')
  WHERE 'elegant' = ANY(aroma_tags) AND NOT ('refined' = ANY(taste_tags));
UPDATE sake_entries SET aroma_tags = array_remove(aroma_tags, 'elegant')
  WHERE 'elegant' = ANY(aroma_tags);

UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'full-body')
  WHERE 'rich-aroma' = ANY(aroma_tags) AND NOT ('full-body' = ANY(taste_tags));
UPDATE sake_entries SET aroma_tags = array_remove(aroma_tags, 'rich-aroma')
  WHERE 'rich-aroma' = ANY(aroma_tags);

-- ============================================================
-- 4. Taste id remaps
-- ============================================================
UPDATE sake_entries SET taste_tags = array_replace(taste_tags, 'umami',      'umami-style')
  WHERE 'umami' = ANY(taste_tags);
UPDATE sake_entries SET taste_tags = array_replace(taste_tags, 'light-feel', 'light-body')
  WHERE 'light-feel' = ANY(taste_tags);
UPDATE sake_entries SET taste_tags = array_replace(taste_tags, 'clean',      'crisp')
  WHERE 'clean' = ANY(taste_tags);
UPDATE sake_entries SET taste_tags = array_replace(taste_tags, 'deep',       'full-body')
  WHERE 'deep' = ANY(taste_tags);
UPDATE sake_entries SET taste_tags = array_replace(taste_tags, 'creamy',     'silky')
  WHERE 'creamy' = ANY(taste_tags);
UPDATE sake_entries SET taste_tags = array_replace(taste_tags, 'sharp',      'crisp')
  WHERE 'sharp' = ANY(taste_tags);

-- ============================================================
-- 5. Taste removals
-- ============================================================
UPDATE sake_entries SET taste_tags = array_remove(taste_tags, 'warm')
  WHERE 'warm' = ANY(taste_tags);

-- ============================================================
-- 6. Flavor → Method cross-migration
-- ============================================================
UPDATE sake_entries SET method_tags = array_append(method_tags, 'nama')
  WHERE 'nama' = ANY(tags) AND NOT ('nama' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'nama')
  WHERE 'nama' = ANY(tags);

UPDATE sake_entries SET method_tags = array_append(method_tags, 'nigori')
  WHERE 'nigori' = ANY(tags) AND NOT ('nigori' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'nigori')
  WHERE 'nigori' = ANY(tags);

UPDATE sake_entries SET method_tags = array_append(method_tags, 'koshu')
  WHERE 'koshu' = ANY(tags) AND NOT ('koshu' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'koshu')
  WHERE 'koshu' = ANY(tags);

-- ============================================================
-- 7. Flavor removals
-- ============================================================
UPDATE sake_entries SET tags = array_remove(tags, 'restaurant')
  WHERE 'restaurant' = ANY(tags);
UPDATE sake_entries SET tags = array_remove(tags, 'anniversary')
  WHERE 'anniversary' = ANY(tags);

-- ============================================================
-- 8. Free-form Japanese labels → tag ids (safe 1:1 concept matches only)
-- ============================================================
UPDATE sake_entries SET method_tags = array_append(method_tags, 'nama')
  WHERE '生酒' = ANY(tags) AND NOT ('nama' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, '生酒')
  WHERE '生酒' = ANY(tags);

UPDATE sake_entries SET tags = array_replace(tags, '新酒', 'shinshu')
  WHERE '新酒' = ANY(tags);
UPDATE sake_entries SET tags = array_replace(tags, '季節限定', 'seasonal')
  WHERE '季節限定' = ANY(tags);
UPDATE sake_entries SET tags = array_replace(tags, '限定品', 'limited')
  WHERE '限定品' = ANY(tags);

-- ============================================================
-- 9. Type: handle 貴醸酒 (cross-migrate to method)
-- ============================================================
UPDATE sake_entries SET
  method_tags = array_append(method_tags, 'kijoshu'),
  type = NULL
WHERE type = '貴醸酒' AND NOT ('kijoshu' = ANY(method_tags));

-- ============================================================
-- 10. Type: kanji → romaji
-- ============================================================
UPDATE sake_entries SET type = 'junmai'           WHERE type = '純米';
UPDATE sake_entries SET type = 'tokubetsu-junmai' WHERE type = '特別純米';
UPDATE sake_entries SET type = 'junmai-ginjo'     WHERE type = '純米吟醸';
UPDATE sake_entries SET type = 'junmai-daiginjo' WHERE type = '純米大吟醸';
UPDATE sake_entries SET type = 'ginjo'            WHERE type = '吟醸';
UPDATE sake_entries SET type = 'daiginjo'         WHERE type = '大吟醸';
UPDATE sake_entries SET type = 'honjozo'          WHERE type = '本醸造';
UPDATE sake_entries SET type = 'tokubetsu-honjozo' WHERE type = '特別本醸造';
UPDATE sake_entries SET type = 'futsushu'         WHERE type = '普通酒';
UPDATE sake_entries SET type = 'other'            WHERE type = 'その他';

-- ============================================================
-- Verification
-- ============================================================
SELECT
  COUNT(*)                                                          AS total,
  COUNT(*) FILTER (WHERE type IS NOT NULL)                          AS has_type,
  COUNT(*) FILTER (WHERE 'kijoshu' = ANY(method_tags))              AS kijoshu_count,
  COUNT(*) FILTER (WHERE cardinality(method_tags) > 0)              AS with_methods,
  COUNT(*) FILTER (WHERE 'ginjo-aroma' = ANY(aroma_tags))           AS ginjo_aroma_migrated,
  COUNT(*) FILTER (WHERE 'ginjo' = ANY(aroma_tags))                 AS should_be_zero_ginjo_in_aroma
FROM sake_entries;

-- If numbers look right, uncomment COMMIT below to persist:
COMMIT;
