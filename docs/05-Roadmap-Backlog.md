# Phased Implementation Roadmap & Dev Backlog
## EmberOS Mission Control

**Doc status:** v1.0 — derived from PRD, HLD, LLD, API Spec v1.0
**Last updated:** 2026-06-22

---

## 1. Sequencing Principle

Build the **build-control-plane loop** first (smallest, most self-contained, immediately useful for the YouTube series), then **analytics** (read-only, low risk), then **content engine** (highest complexity, most external dependencies), then **public showcase wiring** last (depends on data from the others existing).

Within each phase: prove the backend loop with `curl`/manual triggers *before* writing UI on top of it. This was flagged before and applies throughout — debugging two layers at once is the most common way solo projects like this stall.

---

## 2. Phase Overview

| Phase | Name | Outcome |
|---|---|---|
| 0 | Foundation | Supabase project live, schema + RLS deployed, auth working |
| 1 | Build Control Plane | Trigger a real GitHub Actions build, watch logs live in dashboard |
| 2 | Growth Analytics (read-only) | YouTube/GitHub/X stats auto-syncing, LinkedIn manual entry working |
| 3 | Content Engine — single platform | Blog → AI draft (X only) → review → publish, fully working end-to-end |
| 4 | Content Engine — full platform set | Threads, Reddit, Instagram added; LinkedIn manual-assist flow added |
| 5 | Thumbnails & Clips | Drive photo sourcing + ffmpeg clip extraction wired in |
| 6 | Feedback Loop & Insights | Post-publish metrics + weekly AI insights closing the loop |
| 7 | Public Showcase Wiring | `/work`, `/watch` pulling live data; public build-log opt-in |
| 8 | Community & Calendar | Community activity logging, content calendar UI |

---

## 3. Phase 0 — Foundation

**Goal:** Empty but correctly-secured system running in production.

- [ ] Create Supabase project; note project ref + keys.
- [ ] Run full schema migration from LLD §2 (all tables, in dependency order — `post_drafts` before `content_metrics`).
- [ ] Apply all indexes (LLD §3).
- [ ] Apply all RLS policies (LLD §4); create the one admin Auth user; replace `YOUR_USER_UUID` placeholders with the real UUID.
- [ ] Create Storage buckets: `thumbnails`, `clips`, `blog-images` (LLD §6).
- [ ] Confirm Next.js project on Vercel connects to Supabase using anon key client-side; confirm service role key is **only** ever referenced inside Edge Functions, never in any `NEXT_PUBLIC_*` variable.
- [ ] Set up `/admin` route group with Supabase Auth gate (redirect to login if no session, or session user ≠ admin UUID).

**Exit criteria:** You can log into `/admin`, see an empty dashboard shell, and confirm via Supabase dashboard that RLS blocks anonymous writes to every table.

---

## 4. Phase 1 — Build Control Plane

Reference: HLD §3.3, §4 (`dispatch_build`, `github_webhook`); API Spec §2.1–2.2.

- [ ] Generate fine-grained GitHub PAT scoped to one test repo; store as Edge Function secret.
- [ ] Write + deploy `dispatch_build` Edge Function.
- [ ] Write + deploy `github_webhook` Edge Function; set `SUPABASE_WEBHOOK_SECRET`.
- [ ] Pick one real (or throwaway test) repo; add `.github/workflows/build.yml` per the template.
- [ ] Add `SUPABASE_WEBHOOK_URL` + `SUPABASE_WEBHOOK_SECRET` as that repo's GitHub Actions secrets.
- [ ] **Manual test before any UI**: `curl` `dispatch_build` directly, confirm a `builds` row appears, confirm GitHub Actions actually starts running, confirm `build_logs` rows land as the workflow progresses.
- [ ] Build `/admin/projects` list view + `/admin/projects/[id]` detail view (CRUD for `clone_projects`).
- [ ] Build the "Trigger Build" button wired to `dispatch_build` via a `/api/dispatch-build` route handler.
- [ ] Build the `BuildLogTail` Realtime component (per HLD example).
- [ ] Wire build status badges (queued/running/success/failed) on the project detail page.

**Exit criteria:** From the dashboard, click a button, watch a real GitHub Actions build run, see logs stream in live without refreshing.

---

## 5. Phase 2 — Growth Analytics (read-only)

Reference: HLD §4 (`sync_youtube`, `sync_github`, `sync_twitter`); API Spec §2.3–2.5.

- [ ] Provision API credentials: YouTube API key, GitHub (reuse PAT), X API keys (apply for free-tier developer access if not already done).
- [ ] Write + deploy `sync_youtube`; manually invoke once, confirm `social_metrics` + `content_metrics` populate correctly.
- [ ] Write + deploy `sync_github`; manually invoke once, confirm stars/followers populate.
- [ ] Write + deploy `sync_twitter`; manually invoke once, confirm follower count populates (accept null impressions on free tier).
- [ ] Set up daily cron triggers for all three (Supabase scheduled functions or `pg_cron`).
- [ ] Build `/admin/growth` overview page: one card per platform, latest numbers.
- [ ] Build per-platform detail pages with historical trend chart (simple line chart, e.g. Recharts).
- [ ] Build the LinkedIn manual-entry form (`/admin/growth/linkedin`) → writes `social_metrics` (`source='manual'`).

**Exit criteria:** Dashboard shows real, auto-updating stats for 3 platforms plus a working manual entry for LinkedIn, for at least 7 consecutive days without manual intervention (except LinkedIn's intentional manual step).

---

## 6. Phase 3 — Content Engine: Single Platform (X only)

Reference: HLD §5 (full worked example, simplified to one platform); API Spec §2.7–2.8, §2.11 (twitter branch only).

- [ ] Write + deploy `ingest_blog_post`; wire it to fire from your blog's actual publish flow (or trigger manually via `curl` first to prove the contract).
- [ ] Write + deploy `generate_drafts`, **X prompt template only** for this phase.
- [ ] Decide trigger mechanism for `generate_drafts`: DB trigger via `pg_net`, or simple polling cron checking `content_sources.status='new'`. Polling cron is simpler to debug first; can optimize to a DB trigger later.
- [ ] Manually test: insert a `content_sources` row via SQL editor, confirm a `post_drafts` row appears with reasonable AI-generated text.
- [ ] Provision X API credentials (OAuth2 user context for posting).
- [ ] Write + deploy `publish_post`, **X branch only**.
- [ ] Build `/admin/content/queue` — card UI, showing pending drafts via Realtime subscription.
- [ ] Build the approve/edit/reject actions on each card.
- [ ] Build "Approve & Post" → calls `publish_post` → confirm a real tweet goes live.

**Exit criteria:** A real blog post results in a real, AI-drafted, human-approved, automatically-published tweet — the entire loop, no manual API calls, one platform only.

---

## 7. Phase 4 — Content Engine: Remaining Platforms

Reference: API Spec §2.8, §2.11 (remaining branches); PRD FR-C6.

- [ ] Add LinkedIn, Reddit, Threads, Instagram prompt templates to `generate_drafts`.
- [ ] Provision Reddit API credentials (script-type OAuth2 app).
- [ ] Provision Meta App + apply for Threads/Instagram permissions (**start this early — review can take time**, per HLD §8 / API Spec §3.5 dependency note).
- [ ] Add Reddit branch to `publish_post`; test against a low-stakes subreddit first.
- [ ] Add Threads branch to `publish_post` once Meta approval lands.
- [ ] Add Instagram branch to `publish_post` once Meta approval lands.
- [ ] Add the LinkedIn manual-assist flow: "Copy to clipboard" button + "Mark as Posted" status update (no API call — by design).
- [ ] Extend `/admin/content/queue` UI to show all 5 platform cards per source, with the LinkedIn card visually distinct (manual action required, not "Approve & Post").

**Exit criteria:** One blog post produces 5 drafts across all platforms; 4 auto-publish on approval, LinkedIn is approved-then-manually-posted via the assist flow.

---

## 8. Phase 5 — Thumbnails & Clips

Reference: HLD §3.3 (ffmpeg via GitHub Actions); API Spec §2.9–2.10, §3.7.

- [ ] Provision Google Drive OAuth2 credentials; designate a specific Drive folder for thumbnail source photos.
- [ ] Write a Drive-photo-picker into `/admin/content/thumbnails` — list folder contents, let Pranay pick one per draft.
- [ ] Set up (or reuse) a GitHub repo with an `ffmpeg`-based clip-extraction Actions workflow.
- [ ] Write + deploy `request_clip_job` and `clip_webhook`.
- [ ] Manually test: request a clip job for a known timestamp range on a known video, confirm output lands in the `clips` Storage bucket and `clip_jobs.output_url` updates.
- [ ] Wire thumbnail/clip picker into the content queue cards so a draft can carry a `thumbnail_url`.

**Exit criteria:** A draft post in the queue can have either a Drive photo or an extracted video frame attached as its thumbnail before publishing.

---

## 9. Phase 6 — Feedback Loop & Insights

Reference: HLD §5 (steps 7–8); API Spec §2.6, §2.12.

- [ ] Write + deploy `fetch_post_metrics`; schedule it (+24h, +7d) per `posted_at` timestamp — e.g. a cron that checks for drafts posted 24h/7d ago and haven't yet had that specific metrics pull recorded.
- [ ] Write + deploy `generate_insights`; set weekly cron.
- [ ] Build `/admin/growth/insights` page rendering `growth_insights.summary_md`.

**Exit criteria:** A real published post shows updated engagement numbers a day later, and the following Monday's insight report references real data including that post's performance.

---

## 10. Phase 7 — Public Showcase Wiring

Reference: HLD §3.1 (`/work`, `/watch`); PRD FR-D1–D3.

- [ ] Rewire `/work/[project]` to pull `clone_projects` fields from Supabase instead of static content — including conditionally hiding star counts if zero (carry forward the earlier audit's lesson).
- [ ] Rewire `/watch/[episode]` to pull `episodes` data, embed YouTube video, render `script_md` excerpt.
- [ ] Add the "watch it build live" optional link on project pages where `is_public_buildable = true`.
- [ ] Confirm public RLS policies correctly show only `live`/`building`/`published` content — spot check as an anonymous/incognito session.

**Exit criteria:** Your public portfolio pages are entirely data-driven; updating a row in Supabase updates the live site with no redeploy needed.

---

## 11. Phase 8 — Community & Calendar

Reference: HLD §4 (community_activity, content_calendar); PRD FR-C8.

- [ ] Build `/admin/content/community` — simple log form (platform, activity_type, url, notes).
- [ ] Build `/admin/calendar` — calendar-grid view of `content_calendar`, optionally linked to `episodes`.
- [ ] Establish your own personal cadence rule for Reddit specifically (e.g. "log at least 3 genuine comments before any self-post") — track via this table to keep yourself honest, per the earlier community-risk discussion.

**Exit criteria:** You have a habit-tracking surface for community participation and a forward-looking calendar view tying episodes to planned cross-platform pushes.

---

## 12. Backlog — Explicitly Deferred (not in any phase above)

- Multi-user/SaaS-ification of this tool.
- Paid-tier upgrades for X/Reddit/any platform (revisit only if free-tier limits are actually hit).
- AI-driven video editing beyond timestamp-based clipping.
- LinkedIn automated posting (revisit only if a legitimate API path becomes available — do not pursue scraping).
- Any scraping-based shortcut for any platform.

---

## 13. Related Documents
- Product Requirements Document (PRD)
- System Architecture & High-Level Design (HLD)
- Database Schema & Low-Level Design (LLD)
- API & Integration Contract Spec
