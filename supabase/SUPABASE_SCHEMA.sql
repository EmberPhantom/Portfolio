-- ========================================================
-- EmberOS Database Schema (v1.5 Consolidated)
-- Run these SQL commands in your Supabase SQL Editor
-- ========================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#f97316',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_json JSONB,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI User Context (Memory)
CREATE TABLE IF NOT EXISTS ai_user_context (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OAuth Tokens (Google Photos)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Visitor Logs (Telemetry)
CREATE TABLE IF NOT EXISTS visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Contact Messages (Lead Gen)
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Intelligence Metadata (System Scoping)
CREATE TABLE IF NOT EXISTS intelligence_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Identity Mappings (AI Persona Sync)
CREATE TABLE IF NOT EXISTS identity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('person', 'project', 'location', 'entity')),
  description TEXT NOT NULL,
  mapping TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Intelligence Logs (AI Activity History)
CREATE TABLE IF NOT EXISTS intelligence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- Row-Level Security (RLS) Policies
-- ========================================================

-- Enable RLS for all tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;

-- ✅ Public Read Access: Allow anyone to view published blog posts and categories
CREATE POLICY "Public Read Access" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON blog_posts FOR SELECT USING (published = true);

-- ✅ Public Write-Only Access: Allow tracking and messages, but hide the data
CREATE POLICY "Public Insert Access" ON visitor_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON contact_messages FOR INSERT WITH CHECK (true);

-- ✅ Admin All-Access: Authenticated users (Administrators) can do everything
CREATE POLICY "Admin All Access" ON blog_posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON visitor_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON contact_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON ai_user_context FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON oauth_tokens FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON intelligence_meta FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON identity_mappings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Access" ON intelligence_logs FOR ALL TO authenticated USING (true);

-- ========================================================
-- Initial Data & Functions
-- ========================================================

-- Seed Intelligence Metadata
INSERT INTO intelligence_meta (key, value) 
VALUES 
  ('whitelisted_drive_folders', '[]'),
  ('whitelisted_photo_albums', '[]'),
  ('github_sync_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Views Counter Function
CREATE OR REPLACE FUNCTION increment_views(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts SET views = views + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
