-- Add title and description fields to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for better query performance when fetching non-friend stories
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON public.stories (created_at DESC); 