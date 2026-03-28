-- Migration: Create snaps, stories & story_views tables
-- Run with: supabase db push

-- Enable extensions (may already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* -----------------------------
   Table: snaps
   Purpose: Direct, ephemeral snaps sent to recipients.
----------------------------- */

CREATE TABLE IF NOT EXISTS public.snaps (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_ids UUID[] NOT NULL,  -- Array of recipient user IDs
    media_url    TEXT NOT NULL,     -- Public URL in the `snaps` storage bucket
    type         TEXT NOT NULL CHECK (type IN ('image','video')),
    overlay_meta JSONB,             -- For videos: sticker / caption metadata
    expires_at   TIMESTAMPTZ NOT NULL,
    viewed_by    UUID[] NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to quickly find snaps for a specific recipient (GIN on array column)
CREATE INDEX IF NOT EXISTS snaps_recipient_ids_gin ON public.snaps USING GIN (recipient_ids);

/* -----------------------------
   Table: stories
   Each row represents a *single* snap that is part of a user's story.
----------------------------- */

CREATE TABLE IF NOT EXISTS public.stories (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url     TEXT NOT NULL,      -- Public URL in `stories` bucket
    thumbnail_url TEXT,               -- Extracted frame for video previews
    type          TEXT NOT NULL CHECK (type IN ('image','video')),
    caption       TEXT,
    metadata      JSONB,              -- Overlay metadata for videos, extra info
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ NOT NULL
);

-- Composite index to fetch latest story snaps quickly
CREATE INDEX IF NOT EXISTS stories_user_created_at_idx ON public.stories (user_id, created_at DESC);

/* -----------------------------
   Table: story_views
   Tracks which user has viewed which story snap.
----------------------------- */

CREATE TABLE IF NOT EXISTS public.story_views (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id   UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    viewer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_story_view UNIQUE (story_id, viewer_id)
); 