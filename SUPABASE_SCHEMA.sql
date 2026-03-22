-- Supabase Database Schema for Pranay Chandra Portfolio
-- Run these SQL commands in your Supabase SQL Editor

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitor Logs Table
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

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Blog Posts: Anyone can read published posts
CREATE POLICY "Public read published" ON blog_posts FOR SELECT USING (published = true);

-- Visitor Logs: Anyone can insert, only owner can read
CREATE POLICY "Public insert" ON visitor_logs FOR INSERT WITH CHECK (true);

-- Messages: Anyone can insert, only owner can read
CREATE POLICY "Public insert" ON messages FOR INSERT WITH CHECK (true);

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_views(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts SET views = views + 1 WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
