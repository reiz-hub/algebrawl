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
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_player_id ON reviews (player_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);

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

-- ─── 6. Enable Realtime ─────────────────────────────────────
-- Required for the admin panel's live data subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

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
