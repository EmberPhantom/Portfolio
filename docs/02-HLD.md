# System Architecture & High-Level Design (HLD)
## EmberOS Mission Control

**Doc status:** v1.0 — derived from PRD v1.0
**Last updated:** 2026-06-22

---

## 1. Architectural Principle

**The control plane and the execution plane are different machines.** pranaychandra.dev (Next.js + Supabase) never directly runs builds, video processing, or holds long-lived compute. It triggers, observes, and displays. Heavy work — Docker builds, test suites, ffmpeg video processing — happens on GitHub Actions runners or third-party deploy platforms (Vercel/Railway), which report status back via webhooks. This is the same separation Vercel and Netlify use internally for their own dashboards.

This single principle is why the system fits inside Supabase/Vercel free tiers despite doing "heavy" things.

---

## 2. System Context Diagram

```
                              ┌─────────────────────────┐
                              │        Pranay            │
                              │   (sole admin user)      │
                              └────────────┬─────────────┘
                                           │ browses / approves / triggers
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │         pranaychandra.dev (Next.js)            │
                    │  Public pages  |  /admin control panel        │
                    └───────────────────────┬────────────────────────┘
                                           │ Supabase JS client
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │                  Supabase                     │
                    │  Postgres (all tables) | Auth | Storage        │
                    │  Realtime (build_logs, post_drafts)            │
                    │  Edge Functions (orchestration layer)          │
                    └───┬───────┬───────┬───────┬───────┬────────────┘
                        │       │       │       │       │
            ┌───────────┘  ┌────┘  ┌────┘   ┌───┘   ┌───┘
            ▼              ▼       ▼        ▼        ▼
       ┌─────────┐   ┌──────────┐ ┌──────┐ ┌──────┐ ┌─────────────┐
       │ GitHub   │   │ YouTube  │ │  X   │ │Reddit│ │ Google      │
       │ Actions  │   │ Data API │ │ API  │ │ API  │ │ Drive API   │
       │ (builds, │   │ v3       │ │ v2   │ │      │ │             │
       │ ffmpeg)  │   └──────────┘ └──────┘ └──────┘ └─────────────┘
       └────┬─────┘                                  ┌─────────────┐
            │ deploy                                 │ Threads /   │
            ▼                                        │ Instagram   │
     ┌─────────────┐                                 │ Graph API   │
     │  Vercel /   │                                 └─────────────┘
     │  Railway    │
     │ (clone apps)│                                 ┌─────────────┐
     └─────────────┘                                 │ Claude/      │
                                                       │ Gemini API   │
                                                       │ (generation) │
                                                       └─────────────┘
```

---

## 3. Component Breakdown

### 3.1 Frontend — pranaychandra.dev (Next.js, hosted on Vercel)

| Route group | Access | Purpose |
|---|---|---|
| `/` `/work/*` `/watch/*` `/blog/*` | Public | Showcase, episode pages, blog (already exists, now data-backed) |
| `/admin/projects/*` | Admin only | Build control plane (Module A) |
| `/admin/growth/*` | Admin only | Analytics dashboard (Module B) |
| `/admin/content/*` | Admin only | Content engine + review queue (Module C) |
| `/admin/calendar` | Admin only | Content calendar |
| `/api/*` | Server-side route handlers | Thin proxies to Supabase Edge Functions — keep secrets server-side, never in client bundle |

### 3.2 Supabase — the system's backbone

- **Postgres**: single source of truth, all tables defined in the LLD doc.
- **Auth**: one admin user (Pranay); RLS policies key off `auth.uid()`.
- **Storage**: thumbnails, extracted video clips/frames, blog images.
- **Realtime**: subscribed by the frontend for `build_logs` (live build tail) and `post_drafts` (queue updates without polling).
- **Edge Functions**: the orchestration layer — every external API call (GitHub, YouTube, X, Reddit, Drive, Threads/Instagram, AI generation) happens here, never client-side. See Section 4.

### 3.3 GitHub — execution plane for builds + video processing

- One repo per clone project (`stripe-clone`, `spotify-clone`, etc.), each with a standard `build.yml` Actions workflow (template defined once, copied per repo).
- A separate lightweight repo (or reuse an existing one) hosts the `ffmpeg`-based clip-extraction workflow used by the content engine (Module C, FR-C7).
- Workflows report progress via `curl` to a Supabase Edge Function webhook after each step.

### 3.4 Deploy targets — Vercel / Railway

- Each clone project deploys independently to Vercel (frontend-heavy clones) or Railway (clones needing persistent backend/DB).
- Deploy URL is written back to Supabase (`clone_projects.live_url`) via the same webhook pattern.

### 3.5 Third-party platform integrations

| Platform | Direction | Mechanism |
|---|---|---|
| YouTube | Read (stats, transcripts) | YouTube Data API v3, called from Edge Function on a cron |
| GitHub | Read (stats) + Write (trigger workflows) | GitHub REST API, PAT stored as Edge Function secret |
| X/Twitter | Read (stats) + Write (post) | X API v2, free tier |
| Reddit | Read (n/a) + Write (post) | Reddit API, OAuth2 app credentials |
| Threads | Write (post) | Threads API via linked Instagram Business account |
| Instagram | Write (post) | Instagram Graph API |
| LinkedIn | Read (manual entry only) | No API call — human-entered form |
| Google Drive | Read (photos) | Drive API v3 |
| Claude/Gemini | Generation | Direct API call from Edge Function |

---

## 4. Edge Function Inventory

| Function | Trigger | Responsibility |
|---|---|---|
| `dispatch_build` | Dashboard button click | Creates `builds` row, calls GitHub `workflow_dispatch` |
| `github_webhook` | GitHub Actions step (`curl`) | Writes `build_logs` rows, updates `builds.status` |
| `sync_youtube` | Daily cron | Pulls channel + video stats into `social_metrics` / `content_metrics`; detects new videos into `content_sources` |
| `sync_github` | Daily cron | Pulls follower/star/traffic stats into `social_metrics` |
| `sync_twitter` | Daily cron | Pulls follower stats into `social_metrics` |
| `generate_insights` | Weekly cron | Reads last 4 weeks of `social_metrics` + `content_metrics`, calls AI, writes `growth_insights` |
| `ingest_blog_post` | Webhook from blog publish action | Creates `content_sources` row |
| `generate_drafts` | New `content_sources` row (DB trigger → Edge Function, or polling cron) | Calls AI per platform, writes `post_drafts` rows |
| `request_clip_job` | Admin action in dashboard | Creates `clip_jobs` row, triggers ffmpeg GitHub Actions workflow |
| `clip_webhook` | GitHub Actions ffmpeg workflow (`curl`) | Updates `clip_jobs` with output Storage URL |
| `publish_post` | Admin clicks "Approve & Post" | Branches by platform; calls X/Threads/Reddit/Instagram API; updates `post_drafts.status` |
| `fetch_post_metrics` | Scheduled +24h/+7d after a publish | Pulls engagement stats into `content_metrics` |

---

## 5. Data Flow — Worked Example (the full loop)

**Scenario: Pranay publishes a blog post about Episode 3 (Stripe clone webhook system).**

1. Blog publish action calls `ingest_blog_post` → `content_sources` row created (`source_type='blog'`).
2. A DB trigger (or short polling cron) invokes `generate_drafts` for the new source.
3. `generate_drafts` calls the AI once per target platform (X, LinkedIn, Reddit, Threads, Instagram) with platform-specific prompt templates → 5 `post_drafts` rows inserted, `status='pending'`.
4. Pranay opens `/admin/content/queue`, sees 5 cards via Realtime subscription, edits the Reddit one (tone correction), approves all 5.
5. For X/Threads/Reddit/Instagram: `publish_post` fires per approved draft, posts via respective API, sets `status='posted'`, stores `external_post_url`.
6. For LinkedIn: draft is marked `approved`; dashboard shows "Copy to clipboard" — Pranay pastes manually into LinkedIn, then clicks "Mark as Posted."
7. +24h and +7d later, `fetch_post_metrics` runs per posted draft, pulling engagement into `content_metrics`.
8. The following Monday, `generate_insights` includes this episode's cross-platform performance in the weekly summary.

This same loop pattern (trigger → generate → review → publish → measure) is reused for every content type — it's the one mental model underlying Module C.

---

## 6. Cross-Module Dependencies

```
Module A (Build Control)  ──feeds──>  episodes.youtube_url, clone_projects ──used by──>  Module D (Showcase)
Module C (Content Engine) ──reads───>  episodes (to know what to post about)
Module C (Content Engine) ──writes──>  Module B (social_metrics, content_metrics) via fetch_post_metrics
Module B (Growth Analytics) ──informs──> Module C (insights shape next draft's tone, via generate_insights output referenced in prompts)
```

No module is fully independent — Module B and Module C in particular form a closed feedback loop, which is intentional (PRD FR-C9, FR-B5).

---

## 7. Security Model

- Single admin identity; no role hierarchy needed.
- All write-capable secrets (GitHub PAT, X/Reddit/Threads/Instagram API keys, AI API keys, Supabase service role key) live **only** as Supabase Edge Function secrets — never shipped to the Next.js client bundle, never in `NEXT_PUBLIC_*` env vars.
- Client-side Supabase calls use the **anon key** + RLS only; any privileged operation routes through an Edge Function using the **service role key** server-side.
- GitHub Actions webhook calls authenticate via a shared secret (`SUPABASE_WEBHOOK_SECRET`), checked in `github_webhook`/`clip_webhook` before writing anything.

---

## 8. Scaling Notes (explicitly deferred, not solved now)

Per PRD NFRs, this is intentionally not engineered for scale beyond solo use. Known future pressure points, noted for later:
- Supabase free tier: 500MB DB / 2GB storage / 500K Edge Function calls per month — clip storage will be the first to approach limits if the channel grows.
- GitHub Actions: 2,000 free minutes/month on public repos — video processing jobs are the most likely to consume this.
- X/Reddit free-tier rate limits — fine at current posting cadence (a few posts/week), would need revisiting if posting frequency increases significantly.

These are "cross the bridge when you hit it" items, not v1 design constraints.

---

## 9. Related Documents
- Product Requirements Document (PRD)
- Database Schema & Low-Level Design (LLD)
- API & Integration Contract Spec
- Phased Implementation Roadmap & Dev Backlog
