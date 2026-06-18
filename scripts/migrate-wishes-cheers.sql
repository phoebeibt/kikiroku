-- sake_wishes：用戶的「想喝」書籤（個人私有）
CREATE TABLE IF NOT EXISTS sake_wishes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id   uuid NOT NULL REFERENCES sake_entries(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_id)
);
ALTER TABLE sake_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY wishes_own ON sake_wishes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- sake_cheers：用戶的「乾杯」互動（公開計數）
CREATE TABLE IF NOT EXISTS sake_cheers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id   uuid NOT NULL REFERENCES sake_entries(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_id)
);
ALTER TABLE sake_cheers ENABLE ROW LEVEL SECURITY;
-- 任何人可讀（用於顯示計數）
CREATE POLICY cheers_select ON sake_cheers FOR SELECT USING (true);
-- 只能插入自己的
CREATE POLICY cheers_insert ON sake_cheers FOR INSERT WITH CHECK (auth.uid() = user_id);
