-- Run in Supabase Dashboard → SQL Editor

-- 1. Add brewery_id FK column (sake_breweries.id is integer)
ALTER TABLE sake_products
  ADD COLUMN IF NOT EXISTS brewery_id integer REFERENCES sake_breweries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sake_products_brewery_id_idx ON sake_products(brewery_id);

-- 2. Exact name match (covers ~71 of 88 breweries)
UPDATE sake_products sp
SET brewery_id = sb.id
FROM sake_breweries sb
WHERE sp.brewery_name = sb.name
  AND sp.brewery_id IS NULL;

-- 3. Fuzzy: strip 株式会社 / 有限会社 / 合資会社 + trailing garbage + whitespace
UPDATE sake_products sp
SET brewery_id = sb.id
FROM sake_breweries sb
WHERE sp.brewery_id IS NULL
  AND sp.brewery_name IS NOT NULL
  AND sb.name = regexp_replace(
        regexp_replace(
          regexp_replace(sp.brewery_name,
            '(株式会社|有限会社|合資会社|合名会社)',
            '', 'g'),
          '[　\s]+.*$',   -- strip trailing full-width space + anything after
          ''),
        '[　\s]', '', 'g' -- strip remaining whitespace
      );

-- 4. Via sake_brands cross-reference:
--    sake_products.name matches sake_brands.name → get brewery_id from sake_brands
UPDATE sake_products sp
SET brewery_id = sb2.brewery_id
FROM sake_brands sb2
WHERE sp.brewery_id IS NULL
  AND sp.name = sb2.name
  AND sb2.brewery_id IS NOT NULL;

-- Report result
SELECT
  COUNT(*) FILTER (WHERE brewery_id IS NOT NULL) AS linked,
  COUNT(*) FILTER (WHERE brewery_id IS NULL)     AS unlinked,
  COUNT(*)                                        AS total
FROM sake_products;
