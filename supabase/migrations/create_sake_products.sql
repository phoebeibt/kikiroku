-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS sake_products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  brewery_name text,
  region       text,
  type         text,
  rice         text,
  yeast        text,
  polishing    numeric,
  alcohol      numeric,
  smv          text,
  acidity      numeric,
  is_seasonal  boolean DEFAULT false,
  source_url   text UNIQUE,
  name_romaji  text,
  name_zh      text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sake_products_name_gin
  ON sake_products
  USING gin(to_tsvector('simple',
    coalesce(name, '') || ' ' ||
    coalesce(brewery_name, '') || ' ' ||
    coalesce(name_romaji, '') || ' ' ||
    coalesce(name_zh, '')
  ));

ALTER TABLE sake_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sake_products"
  ON sake_products FOR SELECT
  TO anon, authenticated
  USING (true);
