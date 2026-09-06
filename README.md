# ConcertAI • Passive Multi-Cloud Ingestion & Gemini 1.5 Flash Intelligence Platform

A zero-friction, background media ingestion pipeline and live concert intelligence platform built with **SvelteKit (Svelte 5 Runes)**, **Supabase PostgreSQL**, **Cloudflare R2 / AWS S3**, and **Google Gemini 1.5 Flash**.

---

## ⚡ Architecture & Key Features

1. **Zero-Friction Passive Ingestion Pipeline**:
   - **No Manual Client Uploads**: Operates as a passive background ingestion system monitoring cloud storage and connected provider streams.
   - **Multi-Cloud Stream Support**: Seamlessly ingests from:
     - **iOS Photos / Shortcuts**: Automations sending favorited media triggers.
     - **Google Photos & Drive**: Folder watcher and webhook notifications.
     - **Dropbox**: Webhook notifications for tagged/favorited concert media.
     - **Microsoft OneDrive**: Curated folder synchronization.
     - **Cloudflare R2 & AWS S3**: ObjectCreated event queues and webhook notifications.
   - **Upstream Curated Filtering**: Automatically inspects assets so only curated or favorited clips are sent through Gemini 1.5 Flash, preventing unnecessary API overhead and storage bloat.

2. **Multimodal Intelligence Extraction (Gemini 1.5 Flash)**:
   - **Performer & Artist Identification**: Identifies bands/performers from visual and audio cues with confidence ratings and genre classification.
   - **Time-Synced Lyrics & Spoken Transcripts**: Extracts timestamped lyric lines (`[{ timestamp: "0:14", seconds: 14, text: "..." }]`) enabling interactive click-to-seek video playback.
   - **Domain Tags**: Automatically categorizes lighting (e.g. *Strobe Lighting*, *Laser Canopy*), instruments (*Grand Piano*, *Fender Stratocaster*), crowd dynamics (*Stadium Singalong*, *Phone Flashlights*), and performance style.
   - **Wikipedia & Lore Context Links**: Enriches recognizable songs and tours with historical trivia, tour lore, and Wikipedia reference cards.
   - **Automated Summary**: Generates 1-2 sentence executive highlights of live performance climaxes.

3. **SvelteKit 5 Reactive Gallery**:
   - Built on Svelte 5 runes (`$state`, `$derived`, `$props`).
   - Native HTML5 `<video>` players with interactive timestamp jump controls.
   - Source provider badges showing ingestion origin (*iOS Photos*, *Google Drive*, *Dropbox*, *OneDrive*, *R2/S3*).
   - Provider tab filtering and domain tag filtering.
   - Instant search across lyrics, artists, venues, visual tags, and Wikipedia lore.
   - Native Web Share API integration.
   - Live Supabase Realtime synchronization for instant feed updates as worker jobs complete.

---

## 📁 Architecture & File Structure

```
.
├── .env.example                                      # Environment variables template
├── supabase/
│   └── migrations/
│       └── 20260905000000_create_concert_videos.sql  # Supabase PostgreSQL schema, RLS, indexes & Realtime
├── worker/
│   └── gemini-tagger-worker.ts                       # Cloudflare Worker / Serverless Ingestion & AI Worker
├── src/
│   ├── app.html                                      # App shell & meta tags
│   ├── app.css                                       # Tailwind CSS styling
│   ├── lib/
│   │   ├── types.ts                                  # Strict TypeScript domain types (SyncedLyricLine, LoreLink, etc.)
│   │   ├── supabaseClient.ts                         # Supabase JS client with SSR support
│   │   ├── server/
│   │   │   ├── s3.ts                                 # S3/R2 storage manager
│   │   │   └── gemini.ts                             # Gemini 1.5 Flash multimodal intelligence analyzer
│   │   └── components/
│   │       ├── Header.svelte                         # Live ingestion pipeline indicator & cloud sync control
│   │       ├── VideoCard.svelte                      # HTML5 video player, time-synced lyrics & lore cards
│   │       └── VideoGallery.svelte                   # Grid, provider filter tabs, search & Supabase Realtime
│   └── routes/
│       ├── +layout.svelte                            # Root layout
│       ├── +page.svelte                              # Passive concert intelligence dashboard
│       ├── +page.ts                                  # Page data loader
│       └── api/
│           ├── ingest/
│           │   ├── webhook/+server.ts                # Ingestion webhook for iOS/Google/Dropbox/S3 pushes
│           │   └── sync/+server.ts                   # Background pull/sync trigger
│           ├── process-video/+server.ts              # Gemini AI video processing endpoint
│           └── videos/+server.ts                     # Video gallery feed endpoint
└── package.json
```

---

## 🚀 Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your environment variables:
- `PUBLIC_SUPABASE_URL` & `PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase project keys.
- `SUPABASE_SECRET_KEY`: Supabase backend secret key.
- `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_DOMAIN`: Cloudflare R2 or AWS S3 credentials.
- `GEMINI_API_KEY`: Google AI Studio API key for Gemini 1.5 Flash.
- `WEBHOOK_SECRET`: Secure shared token for authenticating webhook invocations.

### 2. Supabase SQL Migration

Execute `supabase/migrations/20260905000000_create_concert_videos.sql` in the Supabase SQL Editor.

### 3. Type Check & Run

```bash
npm install
npm run check
npm run dev
```

---

## 🌐 Deploying the AI Serverless Ingestion Worker

Deploy `worker/gemini-tagger-worker.ts` as a Cloudflare Worker triggered by R2/S3 event queues or HTTP webhooks:

1. Configure `wrangler.toml`:
   ```toml
   name = "concert-ai-ingestion-worker"
   main = "worker/gemini-tagger-worker.ts"
   compatibility_date = "2024-09-05"

   [[r2_buckets]]
   binding = "R2_BUCKET"
   bucket_name = "concert-videos"
   ```
2. Set Cloudflare secrets:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SECRET_KEY
   npx wrangler secret put WEBHOOK_SECRET
   ```
3. Deploy:
   ```bash
   npx wrangler deploy
   ```
