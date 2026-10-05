-- ============================================
-- NoorGameZone v2 Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT NULL,
  bio TEXT DEFAULT '',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- FRIENDSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own friendships" ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships they received" ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- ============================================
-- ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user achievements" ON user_achievements FOR SELECT USING (true);
-- Server uses service role key for inserts, so no INSERT policy needed for anon

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'game_invite', 'achievement', 'system')),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own notifications" ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
-- Server uses service role key for inserts

-- ============================================
-- GAME RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS game_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'draw-and-guess',
  rounds INTEGER NOT NULL DEFAULT 0,
  player_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view game results" ON game_results FOR SELECT USING (true);

-- ============================================
-- PLAYER SCORES
-- ============================================
CREATE TABLE IF NOT EXISTS player_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view player scores" ON player_scores FOR SELECT USING (true);

-- ============================================
-- PLAYER STATS VIEW (enhanced)
-- ============================================
DROP VIEW IF EXISTS player_stats;
CREATE VIEW player_stats AS
SELECT
  ps.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.level,
  COUNT(*) AS games_played,
  SUM(ps.score) AS total_score,
  MAX(ps.score) AS best_score,
  SUM(CASE WHEN ps.rank = 1 THEN 1 ELSE 0 END) AS wins,
  ROUND(AVG(ps.score)::numeric, 1) AS avg_score,
  gr.game_type
FROM player_scores ps
JOIN game_results gr ON ps.game_id = gr.id
LEFT JOIN profiles p ON ps.user_id = p.id
WHERE ps.user_id IS NOT NULL
GROUP BY ps.user_id, p.username, p.display_name, p.avatar_url, p.level, gr.game_type;

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
  ('first_game', 'First Steps', 'Play your first game', 'gamepad', 10, 'general'),
  ('first_win', 'Winner!', 'Win your first game', 'trophy', 25, 'general'),
  ('play_10', 'Regular', 'Play 10 games', 'target', 50, 'general'),
  ('play_50', 'Dedicated', 'Play 50 games', 'flame', 100, 'general'),
  ('win_5', 'On a Roll', 'Win 5 games', 'fire', 75, 'general'),
  ('score_500', 'High Scorer', 'Score 500 total points', 'star', 50, 'scoring'),
  ('score_2000', 'Point Machine', 'Score 2000 total points', 'zap', 150, 'scoring'),
  ('make_friend', 'Social Butterfly', 'Add your first friend', 'heart', 15, 'social'),
  ('draw_master', 'Draw Master', 'Have all players guess your word', 'pen', 30, 'draw-and-guess'),
  ('speed_guesser', 'Speed Guesser', 'Guess the word in under 10 seconds', 'bolt', 30, 'draw-and-guess')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_player_scores_user ON player_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_type ON game_results(game_type);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
