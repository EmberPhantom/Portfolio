# API & Integration Contract Spec
## EmberOS Mission Control

**Doc status:** v1.0 — derived from HLD v1.0 and LLD v1.0
**Last updated:** 2026-06-22

---

## 1. Conventions

- All internal Edge Functions are invoked via `https://<project-ref>.supabase.co/functions/v1/<function-name>`.
- All internal Edge Function requests/responses use JSON.
- All internal Edge Functions that mutate data require either:
  - A valid Supabase Auth JWT (admin-triggered actions from the dashboard), or
  - A shared-secret `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>` header (GitHub Actions-triggered webhooks).
- Next.js route handlers (`/api/*`) are thin server-side proxies — they attach secrets and forward to Edge Functions; the browser never holds third-party API keys.
- Timestamps: ISO 8601 UTC throughout.

---

## 2. Internal Edge Function Contracts

### 2.1 `dispatch_build`
**Trigger:** Admin dashboard → `/api/dispatch-build` → this function
**Auth:** Supabase JWT (admin)

Request:
```json
{
  "project_id": "uuid",
  "github_repo_full_name": "EmberPhantom/stripe-clone",
  "workflow_file": "build.yml"
}
```
Response (200):
```json
{ "build_id": "uuid" }
```
Response (500):
```json
{ "error": "string description" }
```
Side effects: inserts `builds` row (`status='queued'` → `'running'`), calls GitHub `workflow_dispatch`.

---

### 2.2 `github_webhook`
**Trigger:** GitHub Actions step, via `curl`
**Auth:** `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`

Request:
```json
{
  "build_id": "uuid",
  "step_name": "test",
  "message": "Tests finished",
  "level": "info",
  "status": "success"
}
```
`status` field is optional — only included on terminal steps (success/failed/cancelled); omitted on intermediate progress pings.

Response (200): `"ok"`
Response (401): `"Unauthorized"` — if secret header missing/incorrect.

Side effects: inserts `build_logs` row; if `status` present, updates `builds.status` + `finished_at`.

---

### 2.3 `sync_youtube`
**Trigger:** Daily cron (Supabase scheduled function or external cron hitting the endpoint)
**Auth:** Internal — not user-facing; restrict via IP/secret if exposed as HTTP, or use Supabase's native cron trigger (no public HTTP exposure needed).

No request body (cron-triggered). Internally:
- Calls YouTube Data API v3 `channels.list?part=statistics&mine=true` (or by channel ID) for subscriber/view totals.
- Calls `search.list` + `videos.list` for new videos since last sync.
- For new videos: inserts `content_sources` row (`source_type='youtube'`) and pulls transcript via captions endpoint into `raw_content`.
- Upserts `social_metrics` (platform='youtube', metric_date=today) on conflict.

---

### 2.4 `sync_github`
**Trigger:** Daily cron
Internally calls:
- `GET /users/EmberPhantom` → followers
- `GET /repos/{owner}/{repo}` per tracked repo → stars, forks
- `GET /repos/{owner}/{repo}/traffic/views` per repo (requires push access)

Upserts `social_metrics` (platform='github', metric_date=today), with per-repo breakdown stored in `extra` jsonb.

---

### 2.5 `sync_twitter`
**Trigger:** Daily cron
Calls X API v2 `GET /2/users/me?user.fields=public_metrics`.
Upserts `social_metrics` (platform='twitter', metric_date=today): `followers`, `extra.following_count`, `extra.tweet_count`.

> Free tier limitation: no per-tweet impression data available without a paid tier — `views`/`impressions` fields remain null for twitter rows until/unless upgraded.

---

### 2.6 `generate_insights`
**Trigger:** Weekly cron (e.g. Monday 06:00 UTC)
Internally:
1. Queries `social_metrics` and `content_metrics` for the trailing 4 weeks.
2. Constructs a prompt and calls the AI provider (see §3.6).
3. Inserts one `growth_insights` row with `week_start` = the Monday just started, `summary_md` = AI response, `platforms_covered` = array of platforms with non-null data that week.

---

### 2.7 `ingest_blog_post`
**Trigger:** Webhook fired by the blog publish flow on pranaychandra.dev (e.g. called from the blog's own publish API route)
**Auth:** `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`

Request:
```json
{ "title": "string", "url": "string", "raw_content": "markdown string" }
```
Response (200): `{ "source_id": "uuid" }`
Side effect: inserts `content_sources` row (`source_type='blog'`, `status='new'`).

---

### 2.8 `generate_drafts`
**Trigger:** New `content_sources` row — invoked either via a Postgres trigger calling the Edge Function (using `pg_net` or similar), or a short-interval polling cron checking for `status='new'` rows.
**Auth:** Internal/service role.

Request:
```json
{ "source_id": "uuid" }
```
Internally, for each platform in `['twitter','linkedin','reddit','threads','instagram']`:
1. Loads `content_sources.raw_content`.
2. Calls AI provider with the platform-specific prompt template (§3.6).
3. Inserts a `post_drafts` row (`status='pending'`).

Updates `content_sources.status = 'processed'` once all drafts are created.

Response (200):
```json
{ "draft_ids": ["uuid", "uuid", "uuid", "uuid", "uuid"] }
```

---

### 2.9 `request_clip_job`
**Trigger:** Admin action in `/admin/content/thumbnails`
**Auth:** Supabase JWT (admin)

Request:
```json
{ "source_id": "uuid", "start_seconds": 120, "end_seconds": 145 }
```
Response (200): `{ "clip_job_id": "uuid" }`
Side effect: inserts `clip_jobs` row (`status='queued'`), triggers the ffmpeg GitHub Actions workflow via `workflow_dispatch`, passing `clip_job_id` as an input.

---

### 2.10 `clip_webhook`
**Trigger:** ffmpeg GitHub Actions workflow, via `curl`
**Auth:** `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`

Request:
```json
{ "clip_job_id": "uuid", "status": "done", "output_url": "https://...supabase.co/storage/v1/object/public/clips/xyz.mp4" }
```
Side effect: updates `clip_jobs.status`, `output_url`.

---

### 2.11 `publish_post`
**Trigger:** Admin clicks "Approve & Post" in `/admin/content/queue`
**Auth:** Supabase JWT (admin)

Request:
```json
{ "draft_id": "uuid" }
```
Internally branches on `post_drafts.platform`:

| Platform | API call |
|---|---|
| twitter | `POST /2/tweets` with `draft_text` |
| threads | `POST /v1.0/{threads-user-id}/threads` (create) then `/threads_publish` |
| instagram | `POST /v1.0/{ig-user-id}/media` (create container, attaching `thumbnail_url` if present) then `/media_publish` |
| reddit | `POST /api/submit` with `sr=reddit_subreddit`, title/body from `draft_text` |
| linkedin | **No API call.** Returns a payload signaling the frontend to show copy-to-clipboard UI instead. |

Response (200):
```json
{ "status": "posted", "external_post_url": "https://..." }
```
Response (200, LinkedIn case):
```json
{ "status": "manual_required", "draft_text": "..." }
```
Response (500):
```json
{ "status": "failed", "error": "string" }
```
Side effect: updates `post_drafts.status`, `posted_at`, `external_post_url`, or `error_message` on failure. **Never deletes the draft row regardless of outcome** (PRD auditability requirement).

---

### 2.12 `fetch_post_metrics`
**Trigger:** Scheduled, +24h and +7d after a `post_drafts.posted_at`
Calls the relevant platform's read API (tweet metrics, Reddit post score, Instagram insights, etc.) for `external_post_url`'s corresponding ID.
Inserts a `content_metrics` row linked via `post_draft_id`.

---

## 3. External API Contracts (third-party, summarized)

### 3.1 GitHub REST API
- Auth: PAT (fine-grained, scoped to specific repos), stored as Edge Function secret `GITHUB_PAT`.
- Key endpoints used: `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`, `GET /users/{username}`, `GET /repos/{owner}/{repo}`, `GET /repos/{owner}/{repo}/traffic/views`.
- Rate limit: 5,000 req/hour authenticated — not a constraint at this system's volume.

### 3.2 YouTube Data API v3
- Auth: API key (read-only stats) — stored as `YOUTUBE_API_KEY`.
- Key endpoints: `channels.list`, `search.list`, `videos.list`, captions endpoints for transcripts.
- Quota: 10,000 units/day free — daily sync uses a small fraction of this.

### 3.3 X API v2
- Auth: OAuth2 (User Context) for posting; Bearer token for read-only stats. Stored as `X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN`.
- Key endpoints: `POST /2/tweets`, `GET /2/users/me`.
- Free tier: 1,500 posts/month write, limited read — sufficient at planned cadence.

### 3.4 Reddit API
- Auth: OAuth2 (script-type app), stored as `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_REFRESH_TOKEN`.
- Key endpoint: `POST /api/submit`.
- Rate limit: under 100 QPM for free use — not a constraint.

### 3.5 Threads API / Instagram Graph API (Meta)
- Auth: Long-lived access token tied to a linked Instagram Business/Creator account, via Meta App.
- Key endpoints: container-create + publish pattern, as detailed in §2.11.
- **Dependency**: requires Meta app review for some permission scopes — flagged in PRD/HLD as a possible delay, not a blocker for other modules.

### 3.6 AI Provider (Claude or Gemini)
- Used by: `generate_drafts`, `generate_insights`.
- Auth: API key stored as `AI_API_KEY` (provider-agnostic naming so the function can switch providers without a contract change).
- **Prompt templates (one per platform), each takes `{raw_content}` as input:**

| Platform | Prompt shape |
|---|---|
| Twitter | "Turn this into a 3-6 tweet thread. Hook-first. Each tweet ≤280 chars. No corporate tone." |
| LinkedIn | "Turn this into a long-form LinkedIn post. Professional but personal voice, paragraph breaks, end with one clear CTA." |
| Reddit | "Turn this into a Reddit-native post for r/{subreddit}. Frame as a discussion or lessons-learned, not an announcement. No promotional tone." |
| Threads | "Turn this into a short, casual Threads post. Conversational, 1-3 sentences." |
| Instagram | "Write an Instagram caption for this, plus a block of 8-12 relevant hashtags." |

- **Insight generation prompt**: "Here is 4 weeks of cross-platform growth data: {json_payload}. Identify what's working, what's stalling, and give 2-3 concrete actions for next week. Be specific, reference actual numbers."

### 3.7 Google Drive API v3
- Auth: OAuth2 (Pranay's own account), refresh token stored as `DRIVE_REFRESH_TOKEN`.
- Key endpoint: `GET /files` (list/search a designated folder), `GET /files/{id}?alt=media` (download for thumbnail use).

---

## 4. Webhook Security Summary

| Webhook | Caller | Auth mechanism |
|---|---|---|
| `github_webhook` | GitHub Actions | Shared secret bearer token |
| `clip_webhook` | GitHub Actions (ffmpeg job) | Shared secret bearer token |
| `ingest_blog_post` | pranaychandra.dev's own publish flow | Shared secret bearer token |

All three validate the bearer token before any DB write; mismatch → `401` and no side effects, per LLD reliability requirements.

---

## 5. Related Documents
- Product Requirements Document (PRD)
- System Architecture & High-Level Design (HLD)
- Database Schema & Low-Level Design (LLD)
- Phased Implementation Roadmap & Dev Backlog
