-- Phase 1 Step 1.1: Add brewery_id / brand_id FK columns to sake_awards
-- Run in Supabase Dashboard → SQL Editor.
-- Idempotent: safe to re-run.
--
-- Both sake_breweries.id and sake_brands.id are integer, so FKs are integer.
-- ON DELETE SET NULL: if a brewery/brand row is deleted, keep the award record
-- but null out the FK (we won't lose historical NRIB award data).

ALTER TABLE sake_awards
  ADD COLUMN IF NOT EXISTS brewery_id integer REFERENCES sake_breweries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id   integer REFERENCES sake_brands(id)    ON DELETE SET NULL;

-- NO indexes yet — we add them after backfill (Step 1.3) so the initial
-- UPDATE isn't slowed by index maintenance.

-- Quick sanity check: how many rows before we start?
SELECT
  COUNT(*)                                      AS total_awards,
  COUNT(*) FILTER (WHERE brewery_id IS NOT NULL) AS already_linked_brewery,
  COUNT(*) FILTER (WHERE brand_id   IS NOT NULL) AS already_linked_brand
FROM sake_awards;
