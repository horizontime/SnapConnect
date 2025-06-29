-- Drop embedding-related triggers
DROP TRIGGER IF EXISTS trg_preference_embedding ON public.profiles;
DROP TRIGGER IF EXISTS trg_story_embedding ON public.stories;

-- Drop the associated trigger functions
DROP FUNCTION IF EXISTS public.invoke_generate_preference_embedding() CASCADE;
DROP FUNCTION IF EXISTS public.invoke_generate_story_embedding() CASCADE;

-- Optional: Add a comment to track this change
COMMENT ON TABLE public.profiles IS 'User profiles table - embedding triggers removed';
COMMENT ON TABLE public.stories IS 'Stories table - embedding triggers removed';
