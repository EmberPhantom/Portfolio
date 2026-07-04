# Database Schema & Low-Level Design (LLD)
## EmberOS Mission Control

**Doc status:** v1.0 — derived from HLD v1.0
**Last updated:** 2026-06-22
**Database:** Supabase Postgres

---

## 1. Entity Relationship Overview

```
series ──┬─< clone_projects ──┬─< builds ──< build_logs
          │                    │
          └─< episodes ────────┘
                  │
                  └──< content_sources ──┬─< post_drafts
                                          ├─< clip_jobs
                                          └─< (referenced by content_calendar)

social_metrics        (standalone, platform+date keyed)
content_metrics       (standalone, references post_drafts.external_id loosely)
growth_insights        (standalone, weekly snapshot)
content_calendar        (references episodes optionally)
community_activity     (standalone, manual log)
```

---

## 2. Full Schema (consolidated, all modules)

```sql
-- ============================================================
-- MODULE A: BUILD CONTROL PLANE
-- ============================================================

create table series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  cover_image_url text,
  created_at timestamptz default now()
);

create table clone_projects (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references series(id) on delete cascade,
  name text not null,
  slug text unique not null,
  target_company text,
  description text,
  github_repo_url text,
  github_repo_full_name text,         -- e.g. "EmberPhantom/stripe-clone"
  live_url text,
  status text default 'planned' check (status in ('planned','building','live','archived')),
  tech_stack text[],
  architecture_notes text,
  is_public_buildable boolean default false,  -- gates public build-log visibility
  created_at timestamptz default now()
);

create table episodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references clone_projects(id) on delete cascade,
  series_id uuid references series(id) on delete cascade,
  episode_number int,
  title text not null,
  status text default 'planned' check (status in ('planned','scripting','recording','editing','published')),
  youtube_url text,
  script_md text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references clone_projects(id) on delete cascade,
  github_run_id text,
  workflow_name text,
  status text default 'queued' check (status in ('queued','running','success','failed','cancelled')),
  triggered_by text default 'dashboard',
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table build_logs (
  id uuid primary key default gen_random_uuid(),
  build_id uuid references builds(id) on delete cascade,
  step_name text,
  message text,
  level text default 'info' check (level in ('info','warn','error','success')),
  created_at timestamptz default now()
);

-- ============================================================
-- MODULE B: GROWTH ANALYTICS
-- ============================================================

create table social_metrics (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('youtube','github','twitter','linkedin')),
  metric_date date not null default current_date,
  followers int,
  views int,
  impressions int,
  engagement_count int,
  extra jsonb,
  source text default 'api' check (source in ('api','manual')),
  created_at timestamptz default now(),
  unique (platform, metric_date)
);

create table content_metrics (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  external_id text,                    -- video id / tweet id / post id
  post_draft_id uuid references post_drafts(id) on delete set null,
  title text,
  url text,
  published_at timestamptz,
  views int,
  likes int,
  comments int,
  shares int,
  fetched_at timestamptz default now()
);

create table growth_insights (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  summary_md text,
  platforms_covered text[],
  generated_at timestamptz default now()
);

-- ============================================================
-- MODULE C: CONTENT ENGINE
-- ============================================================

create table content_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('blog','youtube','drive_photo','manual')),
  episode_id uuid references episodes(id) on delete set null,
  title text,
  url text,
  raw_content text,
  drive_file_id text,
  status text default 'new' check (status in ('new','processed','archived')),
  created_at timestamptz default now()
);

create table post_drafts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references content_sources(id) on delete cascade,
  platform text not null check (platform in ('twitter','linkedin','reddit','threads','instagram')),
  draft_text text not null,
  thumbnail_url text,
  status text default 'pending' check (status in ('pending','approved','posted','rejected','needs_edit','failed')),
  scheduled_for timestamptz,
  posted_at timestamptz,
  external_post_url text,
  reddit_subreddit text,
  error_message text,                  -- populated if publish_post fails (NFR: auditability)
  created_at timestamptz default now()
);

create table clip_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references content_sources(id) on delete cascade,
  status text default 'queued' check (status in ('queued','processing','done','failed')),
  start_seconds int,
  end_seconds int,
  output_url text,
  github_run_id text,
  created_at timestamptz default now()
);

create table community_activity (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('reddit','threads','instagram')),
  activity_type text check (activity_type in ('post','comment','reply_to_others')),
  url text,
  notes text,
  engagement_count int,
  logged_at timestamptz default now()
);

create table content_calendar (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  title text not null,
  notes text,
  scheduled_for timestamptz not null,
  status text default 'planned' check (status in ('planned','posted','skipped')),
  related_episode_id uuid references episodes(id) on delete set null,
  created_at timestamptz default now()
);
```

> Note: `content_metrics.post_draft_id` creates a forward reference to `post_drafts`, so table creation order in the actual migration file should declare `post_drafts` before `content_metrics`, or add the FK via `alter table` after both exist.

---

## 3. Indexes

```sql
create index idx_episodes_project on episodes (project_id);
create index idx_builds_project on builds (project_id);
create index idx_build_logs_build_created on build_logs (build_id, created_at);
create index idx_social_metrics_platform_date on social_metrics (platform, metric_date desc);
create index idx_post_drafts_status on post_drafts (status);
create index idx_post_drafts_source on post_drafts (source_id);
create index idx_content_metrics_platform on content_metrics (platform, published_at desc);
create index idx_clip_jobs_source on clip_jobs (source_id);
create index idx_content_calendar_scheduled on content_calendar (scheduled_for);
```

---

## 4. Row Level Security — Full Policy Set

```sql
-- Enable RLS everywhere
alter table series enable row level security;
alter table clone_projects enable row level security;
alter table episodes enable row level security;
alter table builds enable row level security;
alter table build_logs enable row level security;
alter table social_metrics enable row level security;
alter table content_metrics enable row level security;
alter table growth_insights enable row level security;
alter table content_sources enable row level security;
alter table post_drafts enable row level security;
alter table clip_jobs enable row level security;
alter table community_activity enable row level security;
alter table content_calendar enable row level security;

-- ---- Public read policies (only where PRD requires public visibility) ----

create policy "public read series" on series for select using (true);

create policy "public read live or building projects" on clone_projects for select
  using (status in ('live','building'));

create policy "public read published episodes" on episodes for select
  using (status = 'published');

create policy "public read builds for public-buildable projects" on builds for select
  using (exists (
    select 1 from clone_projects p
    where p.id = builds.project_id and p.is_public_buildable = true
  ));

create policy "public read build_logs for public-buildable projects" on build_logs for select
  using (exists (
    select 1 from builds b join clone_projects p on p.id = b.project_id
    where b.id = build_logs.build_id and p.is_public_buildable = true
  ));

-- ---- Admin full-access policies (replace YOUR_USER_UUID with real admin auth.uid()) ----
-- Repeat this pattern for every table in the schema:

create policy "admin full access" on series for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on clone_projects for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on episodes for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on builds for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on build_logs for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on social_metrics for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on content_metrics for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on growth_insights for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on content_sources for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on post_drafts for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on clip_jobs for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on community_activity for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
create policy "admin full access" on content_calendar for all
  using (auth.uid() = 'YOUR_USER_UUID') with check (auth.uid() = 'YOUR_USER_UUID');
```

**Note on `post_drafts`, `social_metrics` (manual LinkedIn rows), `content_metrics`, `growth_insights`, `clip_jobs`, `community_activity`, `content_calendar`: no public read policy exists for these by design (PRD §5 — these are private operational tables, not showcase content).**

---

## 5. Field-Level Notes & Constraints

| Table | Field | Notes |
|---|---|---|
| `clone_projects` | `is_public_buildable` | Defaults `false`. Must be explicitly set `true` per project — prevents accidentally exposing an in-progress messy build to the public (ties to the "hide 0-star/messy proof" lesson from the earlier audit). |
| `post_drafts` | `status='needs_edit'` | Distinct from `rejected` — lets Pranay flag "good idea, bad execution" without losing the draft, vs. `rejected` which is a hard no. |
| `post_drafts` | `error_message` | Always populate on `status='failed'` — never fail silently (PRD NFR: Reliability). |
| `social_metrics` | `unique (platform, metric_date)` | One row per platform per day — upsert on conflict, never duplicate. |
| `content_metrics` | `post_draft_id` nullable | Some content_metrics rows (e.g. YouTube video stats) aren't tied to a `post_draft` at all — only platform-post-engagement rows are. |
| `builds` | `github_run_id` | Populated only after GitHub confirms dispatch; may be briefly null between trigger and confirmation. |

---

## 6. Storage Buckets (Supabase Storage)

| Bucket | Public? | Contents |
|---|---|---|
| `thumbnails` | Public read | Generated/sourced thumbnails for posts and episodes |
| `clips` | Public read | ffmpeg-extracted video clips/frames |
| `blog-images` | Public read | Images embedded in blog posts |

All write access to these buckets happens via Edge Functions using the service role key — no direct client-side upload for anything except the admin's own dashboard forms (which still go through authenticated Supabase client calls, governed by storage RLS mirroring the admin-only pattern above).

---

## 7. Related Documents
- Product Requirements Document (PRD)
- System Architecture & High-Level Design (HLD)
- API & Integration Contract Spec
- Phased Implementation Roadmap & Dev Backlog
