-- Phase 1 Step 1.3: Add indexes on sake_awards FK columns.
-- Run AFTER backfill (20260702_1010) completes.
--
-- Note: Supabase SQL Editor wraps queries in a transaction, which conflicts
-- with CREATE INDEX CONCURRENTLY. Plain CREATE INDEX takes ~1-2s on 27k rows
-- and briefly locks writes — acceptable for this size.
-- WHERE brewery_id IS NOT NULL: partial index — smaller and faster because
-- most queries filter by a specific brewery_id (never = NULL).

CREATE INDEX IF NOT EXISTS sake_awards_brewery_id_idx
  ON sake_awards(brewery_id)
  WHERE brewery_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sake_awards_brand_id_idx
  ON sake_awards(brand_id)
  WHERE brand_id IS NOT NULL;

-- Composite for the common Wiki query pattern:
--   WHERE brewery_id = X AND is_gold = true
CREATE INDEX IF NOT EXISTS sake_awards_brewery_gold_idx
  ON sake_awards(brewery_id, is_gold)
  WHERE brewery_id IS NOT NULL;
