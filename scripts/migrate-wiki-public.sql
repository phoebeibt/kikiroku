-- wiki_articles: allow anonymous (unauthenticated) users to read all rows
-- Editor writes are still restricted to users with is_editor metadata

-- Enable RLS if not already enabled
ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to read
CREATE POLICY wiki_articles_select_public ON wiki_articles
  FOR SELECT USING (true);

-- Only editors can insert/update
CREATE POLICY wiki_articles_write_editor ON wiki_articles
  FOR ALL
  USING  (auth.jwt() -> 'user_metadata' ->> 'is_editor' = 'true')
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'is_editor' = 'true');
