-- ========================================================
-- EmberOS Cron Jobs Setup (using pg_cron & pg_net)
-- ========================================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Seed key/value configs for endpoints if they don't exist
INSERT INTO site_config (key, value, label)
VALUES 
  ('supabase.service_role_key', '', 'Supabase Service Role Key (needed for cron authentication)'),
  ('supabase.project_url', 'https://uzlryapqxjbmgkesuyoj.supabase.co', 'Supabase Project Base URL')
ON CONFLICT (key) DO NOTHING;

-- Helper function to trigger edge functions securely from cron
CREATE OR REPLACE FUNCTION trigger_edge_function(function_name TEXT)
RETURNS VOID AS $$
DECLARE
  project_url TEXT;
  service_key TEXT;
  full_url TEXT;
  headers JSONB;
BEGIN
  -- Retrieve values from site_config
  SELECT value INTO project_url FROM site_config WHERE key = 'supabase.project_url';
  SELECT value INTO service_key FROM site_config WHERE key = 'supabase.service_role_key';
  
  -- Fallback / guard if keys are missing
  IF project_url IS NULL OR project_url = '' OR service_key IS NULL OR service_key = '' THEN
    RAISE WARNING 'trigger_edge_function: Missing URL or service key in site_config. Trigger skipped.';
    RETURN;
  END IF;
  
  full_url := project_url || '/functions/v1/' || function_name;
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || service_key
  );
  
  -- Call the edge function using pg_net asynchronously
  PERFORM net.http_post(
    url := full_url,
    headers := headers,
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule jobs
-- Note: cron.schedule runs in the postgres database context. 
-- Standard cron format: min hour day-of-month month day-of-week

-- 1. Daily YouTube metrics sync at 06:00 UTC
SELECT cron.schedule(
  'sync-youtube-daily',
  '0 6 * * *',
  $$SELECT trigger_edge_function('sync_youtube');$$
);

-- 2. Daily GitHub metrics sync at 06:10 UTC
SELECT cron.schedule(
  'sync-github-daily',
  '10 6 * * *',
  $$SELECT trigger_edge_function('sync_github');$$
);

-- 3. Daily Twitter metrics sync at 06:20 UTC
SELECT cron.schedule(
  'sync-twitter-daily',
  '20 6 * * *',
  $$SELECT trigger_edge_function('sync_twitter');$$
);

-- 4. Weekly growth insights compiler on Mondays at 06:30 UTC
SELECT cron.schedule(
  'generate-insights-weekly',
  '30 6 * * 1',
  $$SELECT trigger_edge_function('generate_insights');$$
);

-- 5. Hourly post engagement metrics fetcher
SELECT cron.schedule(
  'fetch-post-metrics-hourly',
  '0 * * * *',
  $$SELECT trigger_edge_function('fetch_post_metrics');$$
);
