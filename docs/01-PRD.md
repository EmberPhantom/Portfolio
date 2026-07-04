# Product Requirements Document (PRD)
## EmberOS Mission Control

**Owner:** Pranay Chandra
**Doc status:** v1.0
**Last updated:** 2026-06-22

---

## 1. Problem Statement

Pranay is a builder with real, production-grade work (AnserTech, a live business automation platform with paying clients) but his public-facing presence — GitHub, portfolio site, LinkedIn, YouTube, X — does not communicate that credibility within the few seconds a recruiter or collaborator actually spends evaluating it. Separately, content creation (blogs, videos, social posts) and growth tracking are manual, fragmented, and inconsistent, which limits both his job/internship search and his planned YouTube series.

**Core problem, restated simply:** the substance exists; the proof trail and distribution system do not.

---

## 2. Goals

### 2.1 Primary goals
1. **G1 — Credibility infrastructure.** Make pranaychandra.dev a live, data-backed system (not static marketing copy) that demonstrates real engineering ability to recruiters, clients, and viewers.
2. **G2 — Build-in-public content engine.** Launch and sustain a YouTube series ("Building FAANG Clones") where the build process itself — architecture, CI/CD, live logs — is both the content and the proof.
3. **G3 — Unified growth operations.** Track and act on stats across YouTube, GitHub, X, LinkedIn (manual), Reddit, Threads, and Instagram from a single admin panel, with AI-assisted insight generation.
4. **G4 — Distribution automation with review gate.** Turn each blog post / video into ready-to-publish drafts across platforms, with one-click human-approved publishing (LinkedIn excluded — manual paste due to platform API constraints).

### 2.2 Secondary goals
- Build genuine community presence on Reddit/Threads/Instagram, where Pranay currently has low traction.
- Keep the entire system at near-zero infrastructure cost (Supabase + Vercel free tiers, GitHub Actions free minutes).
- Produce a system architecturally interesting enough to be content/interview material in its own right.

### 2.3 Non-goals (explicitly out of scope for v1)
- Fully autonomous posting with no human review (rejected by Pranay — see decision log).
- LinkedIn auto-posting (no viable free API path for individual developers; manual paste accepted as permanent design, not a temporary gap).
- Multi-user / SaaS-ification of this system for other creators. This is a personal tool, not a product to sell, for v1.
- Real-time video editing or full NLE functionality. Clip extraction is timestamp-based, not AI-edited.
- Scraping any platform (LinkedIn or otherwise) for automation. Rejected on account-risk and ToS grounds.

---

## 3. Users

There is exactly one user: **Pranay**, in two modes:
- **Admin/operator mode** — logged into `/admin`, full read/write access.
- **Public visitor mode** — anonymous, read-only access to published content on `/work`, `/watch`, `/blog`.

No multi-tenancy, no team accounts, no public write access anywhere.

---

## 4. Functional Requirements

### 4.1 Module A — Build Control Plane
- FR-A1: Admin can create/edit/archive a `clone_project` (a FAANG-clone build series entry) with metadata (target company, tech stack, GitHub repo, status).
- FR-A2: Admin can trigger a GitHub Actions build for a given project from the dashboard.
- FR-A3: Admin sees a live-streaming log tail of that build (sub-5-second latency via Supabase Realtime) without refreshing the page.
- FR-A4: Build status (queued/running/success/failed) is visible per project and per historical build.
- FR-A5: Public visitors can optionally view build logs for projects explicitly marked public (`status in ('live','building')`) — opt-in per project, not default.

### 4.2 Module B — Growth Analytics
- FR-B1: System automatically pulls daily stats from YouTube (subscribers, views, per-video metrics) via YouTube Data API v3.
- FR-B2: System automatically pulls daily stats from GitHub (followers, stars across repos, traffic) via GitHub API.
- FR-B3: System automatically pulls daily stats from X/Twitter (follower count, via free-tier `public_metrics`) via X API v2.
- FR-B4: Admin manually enters LinkedIn stats (followers, impressions, profile views, top post) via a weekly form — no automation attempted.
- FR-B5: System generates a weekly AI-written insight summary across all platforms, surfaced in `/admin/growth/insights`.
- FR-B6: Dashboard displays unified overview cards (one per platform) plus historical trend charts.

### 4.3 Module C — Content Engine
- FR-C1: A new blog post (published on pranaychandra.dev) automatically creates a `content_source` row.
- FR-C2: A new YouTube video upload is automatically detected (daily cron) and creates a `content_source` row, with transcript pulled via YouTube captions API.
- FR-C3: Admin can manually add a `content_source` (e.g. paste a draft, pick a Drive photo) on demand.
- FR-C4: For each `content_source`, the system generates platform-specific draft posts (X, LinkedIn, Reddit, Threads, Instagram) via AI, each as a separate `post_draft` row with `status = pending`.
- FR-C5: Admin reviews drafts in `/admin/content/queue`: edit inline, approve, or reject.
- FR-C6: On approval, system auto-publishes to X, Threads, Reddit, Instagram via their respective APIs. LinkedIn drafts instead present a "copy to clipboard" + "mark as posted" manual flow.
- FR-C7: System can generate a thumbnail/visual for a draft, sourced from either a Google Drive photo (via Drive API) or an extracted video frame/clip (via GitHub Actions + ffmpeg).
- FR-C8: Admin can log community activity (own comments/replies on Reddit/Threads/Instagram) to track participation-before-promotion behavior.
- FR-C9: Post-publish, system schedules follow-up metric pulls (+24h, +7d) per post into `content_metrics`, feeding back into the weekly insight generator (FR-B5).

### 4.4 Module D — Public Showcase
- FR-D1: `/work/[project]` pages pull live data (status, stars, live URL) from Supabase instead of static copy.
- FR-D2: `/watch/[episode]` pages show embedded YouTube video, episode script excerpt, and optionally a "watch it build" link to public build logs.
- FR-D3: Star counts and other social-proof metrics are hidden from public view until non-zero (explicit decision from the earlier audit — never display a "0" social-proof stat).

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Cost | Must run on Supabase free tier + Vercel free tier + GitHub Actions free minutes. No required paid service except optional AI API usage (pennies/month) and optional LinkedIn API approval (free but uncertain). |
| Security | All admin routes gated behind Supabase Auth; RLS enforced on every table; no API keys or PATs ever exposed client-side — all third-party calls happen server-side via Edge Functions. |
| Latency | Build log Realtime updates visible within ~5 seconds of the GitHub Actions step completing. |
| Reliability | A failed AI generation or failed platform API call must not corrupt the `post_draft` state — it should mark `status = failed` with an error message, never silently disappear. |
| Auditability | Every publish action (who/what/when/where) is logged immutably — no deletion of `post_drafts` history, only status transitions. |
| Account safety | No scraping of any platform. No automation that risks ToS violation or account suspension, especially LinkedIn and Reddit. |
| Maintainability | One person (Pranay) maintains this solo — favor simple, inspectable Edge Functions over clever abstractions. |

---

## 6. Key Decisions & Rationale (Decision Log)

| Decision | Rationale |
|---|---|
| Review-then-approve publishing, not fully autonomous | Pranay explicitly rejected full autonomy — wants final human check before anything goes live, especially given Reddit/LinkedIn reputational risk. |
| LinkedIn excluded from auto-posting | No reliable free self-serve API path for individual developers; scraping rejected on account-risk grounds. |
| Separate GitHub repo per clone project, deployed independently | Confirmed preference — keeps each clone project's CI/CD isolated and matches how real multi-service portfolios are structured. |
| Control plane (dashboard) separate from execution plane (GitHub Actions/Vercel/Railway) | Supabase/Vercel free tier cannot run Docker or long builds; this mirrors how Vercel/Netlify's own dashboards work, so it is legitimate architecture, not a workaround. |
| Reddit/community growth treated as a behavioral problem, not purely technical | Reddit penalizes automated-feeling content; the system supports drafting and tracking participation, but does not pretend to manufacture community trust. |

---

## 7. Success Metrics

- Recruiter-facing: GitHub stars on flagship repos move from 0-1 to double digits within 60 days of launch.
- Content: First 3 episodes of the clone series published with the full pipeline (trigger → build → log → publish) used live on camera.
- Growth: Weekly AI insight report consistently produced for 8+ consecutive weeks (proves the loop is sustained, not abandoned after week 2).
- Distribution: At least 3 of 5 platforms (X, Threads, Reddit, Instagram, LinkedIn-manual) actively receiving published content weekly by week 6.

---

## 8. Related Documents
- System Architecture & High-Level Design (HLD)
- Database Schema & Low-Level Design (LLD)
- API & Integration Contract Spec
- Phased Implementation Roadmap & Dev Backlog
