-- Run in Supabase Dashboard → SQL Editor
-- Creates sake_awards table AND adds brewery_id to sake_products in one go.

-- 1. sake_awards: NRIB 全国新酒鑑評会 award records
CREATE TABLE IF NOT EXISTS sake_awards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year         integer NOT NULL,          -- Western year e.g. 2024
  year_code    text NOT NULL,             -- e.g. 'R06'
  brewery_name text NOT NULL,
  brand_name   text NOT NULL,
  prefecture   text,
  corp_number  text,
  is_gold      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (year, brewery_name, brand_name)
);

CREATE INDEX IF NOT EXISTS sake_awards_brewery_idx   ON sake_awards(brewery_name);
CREATE INDEX IF NOT EXISTS sake_awards_brand_idx     ON sake_awards(brand_name);
CREATE INDEX IF NOT EXISTS sake_awards_year_idx      ON sake_awards(year);
CREATE INDEX IF NOT EXISTS sake_awards_gold_idx      ON sake_awards(is_gold);

ALTER TABLE sake_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sake_awards" ON sake_awards
  FOR SELECT TO anon, authenticated USING (true);

-- 2. Add brewery_id FK to sake_products
ALTER TABLE sake_products
  ADD COLUMN IF NOT EXISTS brewery_id integer REFERENCES sake_breweries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sake_products_brewery_id_idx ON sake_products(brewery_id);

-- 3. Exact brewery name match
UPDATE sake_products sp
SET brewery_id = sb.id
FROM sake_breweries sb
WHERE sp.brewery_name = sb.name
  AND sp.brewery_id IS NULL;

-- 4. Fuzzy match: strip 株式会社/有限会社/合資会社 + trailing noise
UPDATE sake_products sp
SET brewery_id = sb.id
FROM sake_breweries sb
WHERE sp.brewery_id IS NULL
  AND sp.brewery_name IS NOT NULL
  AND sb.name = trim(regexp_replace(
        regexp_replace(sp.brewery_name,
          '(株式会社|有限会社|合資会社|合名会社)', '', 'g'),
        '[　\s].*$', ''));

-- 5. Cross-reference via sake_brands (product name → brand → brewery)
UPDATE sake_products sp
SET brewery_id = sb2.brewery_id
FROM sake_brands sb2
WHERE sp.brewery_id IS NULL
  AND sp.name = sb2.name
  AND sb2.brewery_id IS NOT NULL;

-- Result summary
SELECT
  COUNT(*) FILTER (WHERE brewery_id IS NOT NULL) AS linked,
  COUNT(*) FILTER (WHERE brewery_id IS NULL)     AS unlinked,
  COUNT(*)                                        AS total
FROM sake_products;
