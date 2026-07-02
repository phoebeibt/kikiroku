-- Phase 3 Step 3.1: Create sake_tags table.
-- Single table for all 5 tag categories: aroma / taste / flavor / method / type.
-- Run in Supabase SQL Editor.
--
-- Design decisions:
-- - id text PK: semantic slug ('floral', 'nama', 'junmai-ginjo') for stability
--   and human-readable references. Same slug appears in sake_entries.aroma_tags etc.
-- - category text: constrained to one of 5 values. Enum would be more strict but
--   less flexible for future additions; check constraint is a good middle ground.
-- - sort_order int: fixed display order per category. Zero-based within category.
-- - is_active bool: soft-delete. Historical entries can reference retired tags
--   without their labels disappearing; picker just hides is_active=false.
-- - updated_at: allows client-side cache invalidation later (24h TTL for now).

CREATE TABLE IF NOT EXISTS sake_tags (
  id          text PRIMARY KEY,
  category    text NOT NULL CHECK (category IN ('aroma', 'taste', 'flavor', 'method', 'type')),
  ja          text NOT NULL,
  zh          text NOT NULL,
  en          text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Partial index: picker queries always filter by category + is_active
CREATE INDEX IF NOT EXISTS sake_tags_active_idx
  ON sake_tags(category, sort_order)
  WHERE is_active;

-- RLS: read-only for anon + authenticated (tags are public metadata).
-- Write access only via Supabase Studio (service_role) — content curation is
-- an operator task, not a user action.
ALTER TABLE sake_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sake_tags"
  ON sake_tags FOR SELECT
  TO anon, authenticated
  USING (is_active);

-- Sanity check
SELECT
  COUNT(*)                              AS total,
  COUNT(*) FILTER (WHERE is_active)     AS active
FROM sake_tags;
