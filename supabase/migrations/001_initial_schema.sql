-- ========================================================
-- EmberOS Unified Database Schema (Consolidated Migration)
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 1. Table Definitions
-- ========================================================

-- Site Config (System Control & dynamic values)
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  value_json JSONB,
  label TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#f97316',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
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

-- AI User Context (Memory)
CREATE TABLE IF NOT EXISTS ai_user_context (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Tokens (Integrations Setup)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitor Logs (Telemetry)
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

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Metadata
CREATE TABLE IF NOT EXISTS intelligence_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identity Mappings (AI Persona)
CREATE TABLE IF NOT EXISTS identity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('person', 'project', 'location', 'entity')),
  description TEXT NOT NULL,
  mapping TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Logs
CREATE TABLE IF NOT EXISTS intelligence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Series (Video playlists/articles)
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clone Projects
CREATE TABLE IF NOT EXISTS clone_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  target_company TEXT,
  description TEXT,
  github_repo_url TEXT,
  github_repo_full_name TEXT,
  live_url TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','building','live','archived')),
  tech_stack TEXT[],
  architecture_notes TEXT,
  is_public_buildable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Episodes (Video build series items)
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES clone_projects(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  episode_number INT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','scripting','recording','editing','published')),
  youtube_url TEXT,
  script_md TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Builds Control Plane
CREATE TABLE IF NOT EXISTS builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES clone_projects(id) ON DELETE CASCADE,
  github_run_id TEXT,
  workflow_name TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','running','success','failed','cancelled')),
  triggered_by TEXT DEFAULT 'dashboard',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Build Logs Stream
CREATE TABLE IF NOT EXISTS build_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
  step_name TEXT,
  message TEXT,
  level TEXT DEFAULT 'info' CHECK (level IN ('info','warn','error','success')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Metrics (Historical Pulses)
CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('youtube','github','twitter','linkedin')),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  followers INT,
  views INT,
  impressions INT,
  engagement_count INT,
  extra JSONB,
  source TEXT DEFAULT 'api' CHECK (source IN ('api','manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (platform, metric_date)
);

-- Content Sources (Ingestion)
CREATE TABLE IF NOT EXISTS content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('blog','youtube','drive_photo','manual')),
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  title TEXT,
  url TEXT,
  raw_content TEXT,
  drive_file_id TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','processed','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Drafts (AI queue)
CREATE TABLE IF NOT EXISTS post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter','linkedin','reddit','threads','instagram')),
  draft_text TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','posted','rejected','needs_edit','failed')),
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  external_post_url TEXT,
  reddit_subreddit TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Metrics (Engagement Tracker)
CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  external_id TEXT,
  post_draft_id UUID REFERENCES post_drafts(id) ON DELETE SET NULL,
  title TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  views INT,
  likes INT,
  comments INT,
  shares INT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Growth Insights (AI digests)
CREATE TABLE IF NOT EXISTS growth_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  summary_md TEXT,
  platforms_covered TEXT[],
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clip Jobs (Video snippets)
CREATE TABLE IF NOT EXISTS clip_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','processing','done','failed')),
  start_seconds INT,
  end_seconds INT,
  output_url TEXT,
  github_run_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Activity Log
CREATE TABLE IF NOT EXISTS community_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('reddit','threads','instagram')),
  activity_type TEXT CHECK (activity_type IN ('post','comment','reply_to_others')),
  url TEXT,
  notes TEXT,
  engagement_count INT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Calendar (Planned content items)
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','posted','skipped')),
  related_episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 2. Indexes
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_episodes_project ON episodes (project_id);
CREATE INDEX IF NOT EXISTS idx_builds_project ON builds (project_id);
CREATE INDEX IF NOT EXISTS idx_build_logs_build_created ON build_logs (build_id, created_at);
CREATE INDEX IF NOT EXISTS idx_social_metrics_platform_date ON social_metrics (platform, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_post_drafts_status ON post_drafts (status);
CREATE INDEX IF NOT EXISTS idx_post_drafts_source ON post_drafts (source_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_platform ON content_metrics (platform, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_source ON clip_jobs (source_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled ON content_calendar (scheduled_for);

-- ========================================================
-- 3. Row-Level Security (RLS) & Helper Functions
-- ========================================================

-- Dynamic Admin validation helper
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- If site_config table is not yet seeded or contains no admin.user_uuid,
  -- allow bootstrapper access to set up the admin configuration.
  IF NOT EXISTS (SELECT 1 FROM site_config WHERE key = 'admin.user_uuid') THEN
    RETURN TRUE;
  END IF;

  RETURN auth.uid() = (SELECT value::uuid FROM site_config WHERE key = 'admin.user_uuid');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS everywhere
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE clone_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- ---- Public Read Policies ----
CREATE POLICY "public_read_site_config" ON site_config FOR SELECT USING (NOT (key ILIKE '%api_key%' OR key ILIKE '%token%' OR key ILIKE '%secret%' OR key ILIKE '%password%'));
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public_read_blog_posts" ON blog_posts FOR SELECT USING (published = true);
CREATE POLICY "public_read_series" ON series FOR SELECT USING (true);
CREATE POLICY "public_read_clone_projects" ON clone_projects FOR SELECT USING (status IN ('live','building'));
CREATE POLICY "public_read_episodes" ON episodes FOR SELECT USING (status = 'published');

CREATE POLICY "public_read_builds" ON builds FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM clone_projects p 
    WHERE p.id = builds.project_id AND p.is_public_buildable = TRUE
  )
);

CREATE POLICY "public_read_build_logs" ON build_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM builds b JOIN clone_projects p ON p.id = b.project_id
    WHERE b.id = build_logs.build_id AND p.is_public_buildable = TRUE
  )
);

-- ---- Public Write-Only Policies ----
CREATE POLICY "public_insert_visitor_logs" ON visitor_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);

-- ---- Admin Full-Access Policies ----
CREATE POLICY "admin_all_site_config" ON site_config FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_categories" ON categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_blog_posts" ON blog_posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_ai_user_context" ON ai_user_context FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_oauth_tokens" ON oauth_tokens FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_visitor_logs" ON visitor_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_contact_messages" ON contact_messages FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_intelligence_meta" ON intelligence_meta FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_identity_mappings" ON identity_mappings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_intelligence_logs" ON intelligence_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_series" ON series FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_clone_projects" ON clone_projects FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_episodes" ON episodes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_builds" ON builds FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_build_logs" ON build_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_social_metrics" ON social_metrics FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_content_metrics" ON content_metrics FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_growth_insights" ON growth_insights FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_content_sources" ON content_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_post_drafts" ON post_drafts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_clip_jobs" ON clip_jobs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_community_activity" ON community_activity FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_content_calendar" ON content_calendar FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ========================================================
-- 4. Initial Seed Data & Helper Functions
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

-- Seed Site Config
INSERT INTO site_config (key, value, label)
VALUES
  ('site.version', 'v2.5', 'Site Version Number'),
  ('site.tagline', 'Operating System __ v2.5', 'Hero Tagline'),
  ('site.title', 'EmberOS | Pranay Chandra', 'Public Title Tag'),
  ('site.description', 'A high-performance cinematic dashboard portfolio by Pranay Chandra — Full Stack Engineer & Systems Builder.', 'Meta Description'),
  ('site.owner_name', 'Pranay Chandra', 'Owner Full Name'),
  ('social.github_url', 'https://github.com/EmberPhantom', 'GitHub Profile URL'),
  ('social.linkedin_url', 'https://www.linkedin.com/in/pranay-chandra-wdp', 'LinkedIn Profile URL'),
  ('social.twitter_url', 'https://x.com/_PranayChandra_', 'X/Twitter Profile URL'),
  ('social.email', 'pranaychandra751@gmail.com', 'Contact Email Address'),
  ('homepage.hero_subtitle', 'An autonomous digital environment. Refined for professional performance and minimalist clarity.', 'Homepage Hero Subtitle'),
  ('ai.provider', 'gemini', 'Primary AI Model Provider (gemini or groq)')
ON CONFLICT (key) DO NOTHING;
