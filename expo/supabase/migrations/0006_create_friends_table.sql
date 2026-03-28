-- Create friends table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_both ON public.friends(user_id, friend_id);

-- Enable Row Level Security
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can insert their own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friends;

-- Policy: Users can view friendships where they are involved
CREATE POLICY "Users can view their own friendships" ON public.friends
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Users can insert friendships where they are the user_id
CREATE POLICY "Users can insert their own friendships" ON public.friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete friendships where they are involved
CREATE POLICY "Users can delete their own friendships" ON public.friends
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Grant necessary permissions
GRANT ALL ON public.friends TO authenticated;
GRANT SELECT ON public.friends TO anon; 