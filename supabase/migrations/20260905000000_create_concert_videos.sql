-- ==============================================================================
-- ConcertAI Ingestion-First Pipeline & Gemini Intelligence Schema
-- Passive multi-cloud ingestion (iOS, Google, Microsoft, Dropbox, S3, R2)
-- ==============================================================================

-- 1. Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Videos Table with Ingestion & Enhanced AI Extraction Fields
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_provider TEXT NOT NULL DEFAULT 's3_bucket' CHECK (
        source_provider IN ('ios_photos', 'google_photos', 'google_drive', 'dropbox', 'onedrive', 's3_bucket', 'r2_bucket', 'webhook')
    ),
    source_file_id TEXT,
    filename TEXT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    storage_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT DEFAULT 'video/mp4',
    is_favorited BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL CHECK (
        status IN ('pending_sync', 'ingesting', 'processing', 'ready', 'filtered_out', 'failed')
    ) DEFAULT 'processing',
    error_message TEXT,
    
    -- Enhanced AI Extracted Intelligence (Gemini 1.5 Flash)
    artist TEXT,
    performer_details JSONB DEFAULT '{}'::JSONB,
    venue TEXT,
    lyrics_synced JSONB DEFAULT '[]'::JSONB,
    transcript TEXT,
    visual_tags TEXT[] DEFAULT '{}'::TEXT[],
    lore_links JSONB DEFAULT '[]'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_videos_source_provider ON public.videos (source_provider);
CREATE INDEX IF NOT EXISTS idx_videos_is_favorited ON public.videos (is_favorited);
CREATE INDEX IF NOT EXISTS idx_videos_created_at_desc ON public.videos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos (status);
CREATE INDEX IF NOT EXISTS idx_videos_artist ON public.videos (artist);
CREATE INDEX IF NOT EXISTS idx_videos_visual_tags ON public.videos USING GIN (visual_tags);
CREATE INDEX IF NOT EXISTS idx_videos_lore_links ON public.videos USING GIN (lore_links);

-- 4. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_videos_updated_at ON public.videos;
CREATE TRIGGER set_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to processed videos
CREATE POLICY "Allow public read access to videos"
    ON public.videos
    FOR SELECT
    USING (true);

-- Allow serverless workers / backend insertion
CREATE POLICY "Allow insert for ingestion pipeline"
    ON public.videos
    FOR INSERT
    WITH CHECK (true);

-- Allow serverless workers / backend updates
CREATE POLICY "Allow update for ingestion pipeline"
    ON public.videos
    FOR UPDATE
    USING (true);

-- 6. Enable Realtime Broadcasting for live updates in gallery UI
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'videos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- supabase_realtime publication may not exist in local vanilla postgres
        NULL;
END $$;
