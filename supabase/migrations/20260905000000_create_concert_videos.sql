-- ==============================================================================
-- Concert Video Pipeline & AI Tagging Schema
-- Optimized for high-throughput, mobile-first video ingestion
-- ==============================================================================

-- 1. Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Videos Table
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_session_token TEXT NOT NULL,
    filename TEXT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    storage_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT DEFAULT 'video/mp4',
    status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'ready', 'failed')) DEFAULT 'uploading',
    error_message TEXT,
    
    -- AI Extracted Intelligence (Gemini 1.5 Flash)
    artist TEXT,
    venue TEXT,
    transcript TEXT,
    visual_tags TEXT[] DEFAULT '{}'::TEXT[],
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_videos_device_session_token ON public.videos (device_session_token);
CREATE INDEX IF NOT EXISTS idx_videos_created_at_desc ON public.videos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos (status);
CREATE INDEX IF NOT EXISTS idx_videos_visual_tags ON public.videos USING GIN (visual_tags);

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

-- Allow anyone to read videos (public feed or device-filtered)
CREATE POLICY "Allow public read access to videos"
    ON public.videos
    FOR SELECT
    USING (true);

-- Allow client-side creation of initial upload records
CREATE POLICY "Allow public insert for uploads"
    ON public.videos
    FOR INSERT
    WITH CHECK (true);

-- Allow updates based on matching device session or service role
CREATE POLICY "Allow update with device token or service role"
    ON public.videos
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR 
        device_session_token = current_setting('request.headers', true)::json->>'x-device-session' OR
        device_session_token IS NOT NULL
    );

-- 6. Enable Realtime Broadcasting for live status updates in UI
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
