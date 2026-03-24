-- ========================================================
-- Phase 14: Omni-Intelligence Migrations
-- ========================================================

-- 1. Intelligence Metadata (Settings & Scoping)
CREATE TABLE IF NOT EXISTS intelligence_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Identity Mappings (Manual Tagging)
CREATE TABLE IF NOT EXISTS identity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('person', 'project', 'location', 'entity')),
  description TEXT NOT NULL, -- The visual description from AI (e.g. "Man with glasses")
  mapping TEXT NOT NULL,     -- The real name (e.g. "Dad")
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Intelligence Logs (Historical Context)
CREATE TABLE IF NOT EXISTS intelligence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'photos', 'drive', 'github'
  content TEXT NOT NULL,
  insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE intelligence_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;

-- Default Data for Scoping (Empty whitelists)
INSERT INTO intelligence_meta (key, value) 
VALUES 
  ('whitelisted_drive_folders', '[]'),
  ('whitelisted_photo_albums', '[]'),
  ('github_sync_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
