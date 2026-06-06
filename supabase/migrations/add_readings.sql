-- Add furigana (hiragana) and romaji reading columns to breweries and brands
ALTER TABLE sake_breweries
  ADD COLUMN IF NOT EXISTS furigana text,
  ADD COLUMN IF NOT EXISTS romaji   text;

ALTER TABLE sake_brands
  ADD COLUMN IF NOT EXISTS furigana text,
  ADD COLUMN IF NOT EXISTS romaji   text;

-- Indexes for romaji search
CREATE INDEX IF NOT EXISTS sake_breweries_romaji_idx ON sake_breweries(romaji);
CREATE INDEX IF NOT EXISTS sake_brands_romaji_idx    ON sake_brands(romaji);
