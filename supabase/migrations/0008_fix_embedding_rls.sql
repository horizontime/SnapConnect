-- Add RLS policies for embedding columns

-- Allow authenticated users to update their own profile embeddings
CREATE POLICY "Users can update own preference embedding"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to update story embeddings
-- Note: For backfill operations, we need to allow updates to all stories
-- In production, you might want to restrict this further

-- First, check if we have any existing policies on embedding column
DROP POLICY IF EXISTS "Service role can update story embeddings" ON public.stories;

-- Create a policy that allows authenticated users to update embeddings on their own stories
CREATE POLICY "Users can update embeddings on own stories"
ON public.stories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For batch operations, we'll need to use the service role key
-- which bypasses RLS entirely

-- Add comment to track this change
COMMENT ON COLUMN public.stories.embedding IS 'Vector embedding of story title and description. Updates require authentication or service role.';
COMMENT ON COLUMN public.profiles.preference_embedding IS 'Vector embedding of user preferences. Users can update their own.'; 