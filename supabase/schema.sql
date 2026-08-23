-- =============================================================
-- Algebrawls — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================

-- ─── 1. Users Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  ingame_name TEXT,
  is_guest BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  unlocked_level INTEGER DEFAULT 1,
  level_stars JSONB DEFAULT '{}',
  xp INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 100,
  inventory JSONB DEFAULT '["char_algebro"]',
  equipped_character TEXT DEFAULT 'char_algebro',
  equipped_gear TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration columns for existing installations
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '["char_algebro"]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_character TEXT DEFAULT 'char_algebro';
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_gear TEXT DEFAULT NULL;

-- Multiplayer MMR columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS mmr INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS online_wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS online_losses INTEGER DEFAULT 0;

-- ─── 1b. Match Rooms Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS match_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE,
  mode TEXT NOT NULL DEFAULT 'lobby',
  status TEXT DEFAULT 'waiting',
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES users(id) ON DELETE SET NULL,
  host_name TEXT,
  guest_name TEXT,
  host_mmr INTEGER DEFAULT 1000,
  guest_mmr INTEGER DEFAULT 1000,
  question_seed INTEGER,
  host_score INTEGER DEFAULT 0,
  guest_score INTEGER DEFAULT 0,
  winner_id UUID,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 300,
  selected_topics JSONB DEFAULT '[1,2,3,4,5,6,7]',
  host_ready BOOLEAN DEFAULT FALSE,
  guest_ready BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration columns for existing installations
ALTER TABLE match_rooms ADD COLUMN IF NOT EXISTS selected_topics JSONB DEFAULT '[1,2,3,4,5,6,7]';
ALTER TABLE match_rooms ADD COLUMN IF NOT EXISTS host_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE match_rooms ADD COLUMN IF NOT EXISTS guest_ready BOOLEAN DEFAULT FALSE;

-- ─── 1c. Match Results Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES match_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  result TEXT CHECK (result IN ('win', 'loss', 'draw')),
  mmr_change INTEGER DEFAULT 0,
  mmr_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 1d. Matchmaking Queue Table ────────────────────────────
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  player_name TEXT,
  mmr INTEGER DEFAULT 1000,
  queued_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Reviews Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Admins Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_ingame_name ON users (ingame_name);
CREATE INDEX IF NOT EXISTS idx_users_mmr ON users (mmr DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_player_id ON reviews (player_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);
CREATE INDEX IF NOT EXISTS idx_match_rooms_code ON match_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_match_rooms_status ON match_rooms (status);
CREATE INDEX IF NOT EXISTS idx_match_results_player ON match_results (player_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_mmr ON matchmaking_queue (mmr);

-- ─── 5. Row Level Security ──────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Users: allow anon role full access (matches current Firebase open rules)
CREATE POLICY "Allow read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on users" ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on users" ON users FOR DELETE USING (true);

-- Reviews: allow anon to read and insert
CREATE POLICY "Allow read access on reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow insert on reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete on reviews" ON reviews FOR DELETE USING (true);

-- Admins: no client access (admin panel uses service_role which bypasses RLS)
-- No policies needed — service_role key bypasses RLS entirely

-- Match Rooms: allow anon full access
ALTER TABLE match_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read match_rooms" ON match_rooms FOR SELECT USING (true);
CREATE POLICY "Allow insert match_rooms" ON match_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update match_rooms" ON match_rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete match_rooms" ON match_rooms FOR DELETE USING (true);

-- Match Results: allow anon full access
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read match_results" ON match_results FOR SELECT USING (true);
CREATE POLICY "Allow insert match_results" ON match_results FOR INSERT WITH CHECK (true);

-- Matchmaking Queue: allow anon full access
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read matchmaking_queue" ON matchmaking_queue FOR SELECT USING (true);
CREATE POLICY "Allow insert matchmaking_queue" ON matchmaking_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update matchmaking_queue" ON matchmaking_queue FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete matchmaking_queue" ON matchmaking_queue FOR DELETE USING (true);

-- ─── 6. Enable Realtime ─────────────────────────────────────
-- Required for the admin panel's live data subscriptions and multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE match_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;

-- ─── 7. Database Functions ──────────────────────────────────
-- Returns the auth email for a given user ID.
-- SECURITY DEFINER allows the anon key to query auth.users safely.
-- Used by the mobile app's login flow to resolve username → email.
CREATE OR REPLACE FUNCTION get_auth_email(target_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = target_user_id LIMIT 1;
$$;
