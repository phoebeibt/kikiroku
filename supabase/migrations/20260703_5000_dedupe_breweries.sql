-- Phase 5: Deduplicate breweries with same name + same prefecture.
-- Discovered during Phase 1 backfill: 122 name-collision groups; of those,
-- 45 groups are TRUE duplicates (same name + same area_id) — data entry doubles.
--
-- Strategy for each duplicate group:
--   1. Canonical = MIN(id) — earliest row wins
--   2. Migrate FK references from extras → canonical:
--      · sake_brands.brewery_id
--      · sake_awards.brewery_id
--      · sake_products.brewery_id
--   3. DELETE extra rows
--
-- Uses a TEMP TABLE dedup_map (extra_id, canonical_id) for clarity.
--
-- Note: entries with same name in DIFFERENT prefectures (e.g., 田中酒造 in
-- 北海道 vs 新潟県) are separate businesses — LEFT UNTOUCHED.

BEGIN;

-- 1. Build the merge map: same name + same area → canonical is MIN(id)
CREATE TEMP TABLE dedup_map ON COMMIT DROP AS
WITH grouped AS (
  SELECT
    name, area_id,
    MIN(id)      AS canonical_id,
    array_agg(id ORDER BY id) AS all_ids
  FROM sake_breweries
  WHERE name IS NOT NULL AND trim(name) <> ''
  GROUP BY name, area_id
  HAVING COUNT(*) > 1
)
SELECT
  extra_id,
  canonical_id
FROM grouped, unnest(all_ids) AS extra_id
WHERE extra_id <> canonical_id;

-- Show the merge map (for verification before deletion)
SELECT COUNT(*) AS rows_to_merge FROM dedup_map;

-- 2. Migrate sake_brands.brewery_id references
UPDATE sake_brands b
SET brewery_id = m.canonical_id
FROM dedup_map m
WHERE b.brewery_id = m.extra_id;

-- 3. Migrate sake_awards.brewery_id references
UPDATE sake_awards a
SET brewery_id = m.canonical_id
FROM dedup_map m
WHERE a.brewery_id = m.extra_id;

-- 4. Migrate sake_products.brewery_id references
UPDATE sake_products p
SET brewery_id = m.canonical_id
FROM dedup_map m
WHERE p.brewery_id = m.extra_id;

-- 5. Delete the extra brewery rows
DELETE FROM sake_breweries
WHERE id IN (SELECT extra_id FROM dedup_map);

-- 6. Verification: expect the same-name-same-prefecture groups to now be 0
SELECT
  COUNT(*) AS total_breweries,
  (SELECT COUNT(*) FROM (
     SELECT name, area_id FROM sake_breweries
     WHERE name IS NOT NULL AND trim(name) <> ''
     GROUP BY name, area_id
     HAVING COUNT(*) > 1
   ) x) AS remaining_dupe_groups;

COMMIT;
