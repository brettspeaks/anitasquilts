# ConcertAI • High-Speed Video Upload & Automated AI Tagging Pipeline

A mobile-first video ingestion pipeline and AI multimodal intelligence extraction system built with **SvelteKit (Svelte 5 Runes)**, **Supabase PostgreSQL**, **Cloudflare R2 / AWS S3**, and **Google Gemini 1.5 Flash**.

---

## ⚡ Key Features

1. **iOS / PWA Minimalist Upload UI**:
   - Ultra-clean single-button interface (`Upload Concert Video`) with direct camera roll and recording support.
   - **Direct-to-S3/R2 Streaming**: Zero server bottleneck by uploading directly from mobile client to presigned storage URLs with live byte-level progress and throughput tracking.
   - **Screen Wake Lock**: Prevents iOS & Android screen sleep during large video uploads using the JavaScript Web Wake Lock API (`navigator.wakeLock`), including automatic re-acquisition on tab visibility changes.
   - **Hands-Off Device Authentication**: Automatic persistent device session token generated and stored in `localStorage`.
   - **Optimistic UI**: Instant local placeholder rendering with live progress and blurred thumbnail as soon as upload begins.

2. **Automated AI Tagging Worker (Gemini 1.5 Flash)**:
   - Serverless worker and webhook route (`/api/process-video` & `worker/gemini-tagger-worker.ts`).
   - Extracts structured concert intelligence:
     - **Artist / Band name** (identified from audio/visuals)
     - **Lyrics & spoken speech transcript**
     - **Visual tags** (*Stage Lighting*, *Acoustic Performance*, *Crowd Shot*, etc.)
     - **Venue / Environment context** (*Outdoor Stadium*, *Dim Indoor Bar*, etc.)
   - Auto-stores intelligence, visual tag arrays (indexed via GIN), and CDN URLs in Supabase PostgreSQL.

3. **Video Gallery**:
   - Responsive grid (1 col on mobile, 2 on tablet, 3 on desktop) sorted newest-first.
   - Native HTML5 `<video controls playsinline>` players.
   - Auto-generated visual tag pills displayed directly beneath each clip.
   - Instant search and tag filtering.
   - Native mobile sharing via Web Share API (`navigator.share`).
   - Live synchronization via Supabase Realtime and reactive polling.

---

## 📁 Architecture & File Structure

```
.
├── .env.example                                      # Environment variables template
├── supabase/
│   └── migrations/
│       └── 20260905000000_create_concert_videos.sql  # Supabase PostgreSQL schema, RLS, indexes & Realtime
├── worker/
│   └── gemini-tagger-worker.ts                       # Standalone Cloudflare / Serverless AI worker
├── src/
│   ├── app.html                                      # PWA & iOS web app meta tags
│   ├── app.css                                       # Tailwind CSS styling
│   ├── lib/
│   │   ├── types.ts                                  # Strict TypeScript domain types
│   │   ├── wakeLock.ts                               # Web Wake Lock manager for iOS/Android
│   │   ├── deviceSession.ts                          # Hands-off persistent device session manager
│   │   ├── supabaseClient.ts                         # Supabase JS client with SSR support
│   │   ├── server/
│   │   │   ├── s3.ts                                 # S3/R2 presigned URL and storage manager
│   │   │   └── gemini.ts                             # Gemini 1.5 Flash multimodal intelligence analyzer
│   │   └── components/
│   │       ├── Header.svelte                         # App bar with device token & online status
│   │       ├── UploadButton.svelte                   # Master single-button upload & progress tracker
│   │       ├── VideoCard.svelte                      # HTML5 video player, tag pills & transcript
│   │       └── VideoGallery.svelte                   # Grid, search, tag filters & Supabase Realtime
│   └── routes/
│       ├── +layout.svelte                            # Root layout
│       ├── +page.svelte                              # Concert feed page
│       ├── +page.ts                                  # SSR/Client page data loader
│       └── api/
│           ├── upload/
│           │   ├── presign/+server.ts                # S3/R2 Presigned PUT URL generator
│           │   └── mock-direct-upload/+server.ts     # Local dev direct upload fallback
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

Fill in your service keys:
- `PUBLIC_SUPABASE_URL` & `PUBLIC_SUPABASE_PUBLISHABLE_KEY`: From your Supabase Project Settings (new API key structure, replaces legacy anon key).
- `SUPABASE_SECRET_KEY`: Supabase secret API key for backend operations (replaces legacy service_role key).
- `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_DOMAIN`: Cloudflare R2 or AWS S3 credentials.
- `GEMINI_API_KEY`: From Google AI Studio.

### 2. Supabase SQL Migration

Run the migration script in `supabase/migrations/20260905000000_create_concert_videos.sql` in the Supabase SQL Editor.

### 3. Install & Run Development Server

```bash
npm install
npm run dev
```

### 4. Type Check & Build

```bash
npm run check
npm run build
```

---

## 🌐 Deploying the AI Serverless Worker

To deploy `worker/gemini-tagger-worker.ts` as a Cloudflare Worker triggered by R2 uploads:
1. Configure `wrangler.toml` with your R2 bucket binding:
   ```toml
   name = "concert-ai-tagger"
   main = "worker/gemini-tagger-worker.ts"
   compatibility_date = "2024-09-05"

   [[r2_buckets]]
   binding = "R2_BUCKET"
   bucket_name = "concert-videos"
   ```
2. Set environment secrets in Cloudflare:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SECRET_KEY
   ```
3. Deploy:
   ```bash
   npx wrangler deploy
   ```
