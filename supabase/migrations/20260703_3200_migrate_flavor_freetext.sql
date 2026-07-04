-- Short-term cleanup: migrate remaining Japanese free-text tags in
-- sake_entries.tags to correct tag categories.
--
-- Users typed these as free-form flavor tags (before proper category pickers),
-- e.g., 甘口, 濃醇, 生酛, にごり. Each concept has a real tag id now — move it.
--
-- Strategy per row:
--   1. If Japanese label matches a real tag concept, append to correct category
--      array (unless already present), then remove from tags.
--   2. Truly personal notes (地酒, 寿司, ブレンド, ライチ) stay in tags.
--
-- Idempotent: all UPDATEs guard against duplicate appends.

BEGIN;

-- ============================================================
-- To method_tags
-- ============================================================
UPDATE sake_entries SET method_tags = array_append(method_tags, 'nigori')
  WHERE 'にごり' = ANY(tags) AND NOT ('nigori' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'にごり')
  WHERE 'にごり' = ANY(tags);

UPDATE sake_entries SET method_tags = array_append(method_tags, 'nigori')
  WHERE 'うすにごり' = ANY(tags) AND NOT ('nigori' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'うすにごり')
  WHERE 'うすにごり' = ANY(tags);

UPDATE sake_entries SET method_tags = array_append(method_tags, 'sparkling')
  WHERE '微発泡' = ANY(tags) AND NOT ('sparkling' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, '微発泡')
  WHERE '微発泡' = ANY(tags);

UPDATE sake_entries SET method_tags = array_append(method_tags, 'koshu')
  WHERE 'Aged' = ANY(tags) AND NOT ('koshu' = ANY(method_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'Aged')
  WHERE 'Aged' = ANY(tags);

-- ============================================================
-- To taste_tags
-- ============================================================
UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'sweet')
  WHERE '甘口' = ANY(tags) AND NOT ('sweet' = ANY(taste_tags));
UPDATE sake_entries SET tags = array_remove(tags, '甘口')
  WHERE '甘口' = ANY(tags);

UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'sweet')
  WHERE 'やや甘い' = ANY(tags) AND NOT ('sweet' = ANY(taste_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'やや甘い')
  WHERE 'やや甘い' = ANY(tags);

UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'dry')
  WHERE '辛口' = ANY(tags) AND NOT ('dry' = ANY(taste_tags));
UPDATE sake_entries SET tags = array_remove(tags, '辛口')
  WHERE '辛口' = ANY(tags);

UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'full-body')
  WHERE '濃醇' = ANY(tags) AND NOT ('full-body' = ANY(taste_tags));
UPDATE sake_entries SET tags = array_remove(tags, '濃醇')
  WHERE '濃醇' = ANY(tags);

UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'umami-rich')
  WHERE '旨味' = ANY(tags) AND NOT ('umami-rich' = ANY(taste_tags));
UPDATE sake_entries SET tags = array_remove(tags, '旨味')
  WHERE '旨味' = ANY(tags);

UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'acidic')
  WHERE '酸味' = ANY(tags) AND NOT ('acidic' = ANY(taste_tags));
UPDATE sake_entries SET tags = array_remove(tags, '酸味')
  WHERE '酸味' = ANY(tags);

UPDATE sake_entries SET taste_tags = array_append(taste_tags, 'balanced')
  WHERE 'バランス' = ANY(tags) AND NOT ('balanced' = ANY(taste_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'バランス')
  WHERE 'バランス' = ANY(tags);

-- ============================================================
-- To aroma_tags
-- ============================================================
UPDATE sake_entries SET aroma_tags = array_append(aroma_tags, 'fruity')
  WHERE 'フルーティー' = ANY(tags) AND NOT ('fruity' = ANY(aroma_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'フルーティー')
  WHERE 'フルーティー' = ANY(tags);

UPDATE sake_entries SET aroma_tags = array_append(aroma_tags, 'floral')
  WHERE '華やか' = ANY(tags) AND NOT ('floral' = ANY(aroma_tags));
UPDATE sake_entries SET tags = array_remove(tags, '華やか')
  WHERE '華やか' = ANY(tags);

UPDATE sake_entries SET aroma_tags = array_append(aroma_tags, 'pear')
  WHERE '梨' = ANY(tags) AND NOT ('pear' = ANY(aroma_tags));
UPDATE sake_entries SET tags = array_remove(tags, '梨')
  WHERE '梨' = ANY(tags);

UPDATE sake_entries SET aroma_tags = array_append(aroma_tags, 'herbal')
  WHERE 'ヘルバル' = ANY(tags) AND NOT ('herbal' = ANY(aroma_tags));
UPDATE sake_entries SET tags = array_remove(tags, 'ヘルバル')
  WHERE 'ヘルバル' = ANY(tags);

-- ============================================================
-- Leave in tags (truly personal or ambiguous):
--   地酒, 寿司, ブレンド, ライチ, 余韻, 爽やか
-- ============================================================

-- Verification: expect the moved Japanese labels not to appear anymore
SELECT
  COUNT(*) FILTER (WHERE '甘口' = ANY(tags))       AS remain_amakuchi,
  COUNT(*) FILTER (WHERE '辛口' = ANY(tags))       AS remain_karakuchi,
  COUNT(*) FILTER (WHERE 'にごり' = ANY(tags))     AS remain_nigori,
  COUNT(*) FILTER (WHERE 'フルーティー' = ANY(tags)) AS remain_fruity,
  COUNT(*) FILTER (WHERE '梨' = ANY(tags))         AS remain_nashi
FROM sake_entries;

COMMIT;
