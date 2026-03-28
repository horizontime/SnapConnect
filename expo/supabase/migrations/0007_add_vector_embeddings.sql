-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add embedding column to profiles table for user preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preference_embedding vector(1536);

-- Create an index for faster similarity search on stories
CREATE INDEX IF NOT EXISTS stories_embedding_idx ON public.stories 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a function to search stories by similarity
CREATE OR REPLACE FUNCTION search_similar_stories(
  query_embedding vector(1536),
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  media_url text,
  thumbnail_url text,
  created_at timestamptz,
  expires_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.title,
    s.description,
    s.media_url,
    s.thumbnail_url,
    s.created_at,
    s.expires_at,
    1 - (s.embedding <=> query_embedding) as similarity
  FROM public.stories s
  WHERE s.embedding IS NOT NULL
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment to track the change
COMMENT ON COLUMN public.stories.embedding IS 'Vector embedding of story title and description using OpenAI text-embedding-3';
COMMENT ON COLUMN public.profiles.preference_embedding IS 'Vector embedding of user preferences (woods, tools, projects) using OpenAI text-embedding-3'; 