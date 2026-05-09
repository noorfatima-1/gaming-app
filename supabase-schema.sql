-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Game results table: one row per completed game
CREATE TABLE game_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now(),
  rounds INTEGER NOT NULL,
  player_count INTEGER NOT NULL
);

-- Player scores: one row per player per game
CREATE TABLE player_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES game_results(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now()
);

-- Player lifetime stats (auto-updated view)
CREATE VIEW player_stats AS
SELECT
  user_id,
  username,
  COUNT(*) AS games_played,
  SUM(score) AS total_score,
  MAX(score) AS best_score,
  SUM(CASE WHEN rank = 1 THEN 1 ELSE 0 END) AS wins,
  ROUND(AVG(score), 1) AS avg_score
FROM player_scores
WHERE user_id IS NOT NULL
GROUP BY user_id, username;

-- Enable Row Level Security
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;

-- Everyone can read game results and scores
CREATE POLICY "Anyone can read game results" ON game_results FOR SELECT USING (true);
CREATE POLICY "Anyone can read player scores" ON player_scores FOR SELECT USING (true);

-- Server inserts via service role (bypasses RLS), but also allow authenticated inserts
CREATE POLICY "Authenticated users can insert game results" ON game_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can insert player scores" ON player_scores FOR INSERT WITH CHECK (true);
