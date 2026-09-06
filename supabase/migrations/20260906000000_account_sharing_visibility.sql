-- ==============================================================================
-- Anita's Underground AI: Account Management, Asset Sharing & Visibility Schema
-- Multi-tenant workspace teams, role-based controls & Granular Media Sharing
-- ==============================================================================

-- 1. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'curator' CHECK (role IN ('viewer', 'curator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Teams / Workspaces Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'curator' CHECK (role IN ('viewer', 'curator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(team_id, user_id)
);

-- 4. Create Visibility Enum & Alter Videos Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_visibility') THEN
        CREATE TYPE media_visibility AS ENUM ('private', 'team', 'public');
    END IF;
END $$;

ALTER TABLE public.videos 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS visibility media_visibility NOT NULL DEFAULT 'private',
    ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 5. Create Granular Media Shares Table
CREATE TABLE IF NOT EXISTS public.media_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    shared_with_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'annotate', 'admin')),
    share_token TEXT UNIQUE,
    expires_at TIMESTAMPTZ,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Indexes for Fast Multi-Tenant & Visibility Queries
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON public.videos (visibility);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos (user_id);
CREATE INDEX IF NOT EXISTS idx_videos_team_id ON public.videos (team_id);
CREATE INDEX IF NOT EXISTS idx_videos_share_token ON public.videos (share_token);
CREATE INDEX IF NOT EXISTS idx_media_shares_video_id ON public.media_shares (video_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_shared_with_user ON public.media_shares (shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_media_shares_shared_with_email ON public.media_shares (shared_with_email);
CREATE INDEX IF NOT EXISTS idx_media_shares_token ON public.media_shares (share_token);

-- 7. Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_shares ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Public profile view"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Teams RLS
CREATE POLICY "Members can view their teams"
    ON public.teams FOR SELECT
    USING (
        auth.uid() = owner_id OR 
        EXISTS (SELECT 1 FROM public.team_members WHERE team_id = public.teams.id AND user_id = auth.uid())
    );

-- Re-configure Videos RLS
DROP POLICY IF EXISTS "Allow public read access to videos" ON public.videos;

CREATE POLICY "Videos Read Access Rule"
    ON public.videos FOR SELECT
    USING (
        -- 1. Public underground media
        visibility = 'public'
        -- 2. Owner has full access
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        -- 3. Team members can view team media
        OR (
            visibility = 'team' AND team_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.team_members 
                WHERE team_id = public.videos.team_id AND user_id = auth.uid()
            )
        )
        -- 4. Shared directly with user ID or email
        OR EXISTS (
            SELECT 1 FROM public.media_shares
            WHERE video_id = public.videos.id AND (
                shared_with_user_id = auth.uid() OR
                shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
            AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
        )
    );

CREATE POLICY "Videos Curator/Admin Write Access"
    ON public.videos FOR UPDATE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.media_shares
            WHERE video_id = public.videos.id 
            AND shared_with_user_id = auth.uid() 
            AND permission IN ('annotate', 'admin')
        )
    );

-- Media Shares RLS
CREATE POLICY "View shares if video owner or recipient"
    ON public.media_shares FOR SELECT
    USING (
        shared_with_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.videos WHERE id = video_id AND user_id = auth.uid())
    );

CREATE POLICY "Create shares if video owner or admin"
    ON public.media_shares FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.videos WHERE id = video_id AND (user_id = auth.uid() OR user_id IS NULL))
    );

CREATE POLICY "Delete shares if video owner"
    ON public.media_shares FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM public.videos WHERE id = video_id AND user_id = auth.uid())
    );
