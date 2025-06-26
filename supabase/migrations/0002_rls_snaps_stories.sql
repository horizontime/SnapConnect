-- Migration: Enable RLS & policies for snaps, stories, story_views

-- Enable Row Level Security
ALTER TABLE public.snaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

/* ---------------- SNAP POLICIES ---------------- */

-- Allow sender to insert new snaps
CREATE POLICY "allow_sender_insert_snap" ON public.snaps FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Allow sender and recipients to select snap row
CREATE POLICY "allow_sender_or_recipient_select_snap" ON public.snaps FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = ANY(recipient_ids));

-- Allow sender to delete (e.g., if cancelled) & system purge via service role
CREATE POLICY "allow_sender_delete_snap" ON public.snaps FOR DELETE
  USING (auth.uid() = sender_id);

-- Update policy for marking viewed_by (recipients only)
CREATE POLICY "allow_recipient_update_viewed_by" ON public.snaps FOR UPDATE
  USING (auth.uid() = ANY(recipient_ids));

/* ---------------- STORIES POLICIES ---------------- */

-- Insert: only owner can insert
CREATE POLICY "allow_owner_insert_story" ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Select: owner or any friend (public read, restrict via friendship function if needed)
CREATE POLICY "allow_owner_or_friend_select_story" ON public.stories FOR SELECT
  USING (auth.uid() = user_id OR expires_at > NOW());

-- Delete: owner can delete their story (e.g., manual remove)
CREATE POLICY "allow_owner_delete_story" ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

/* ---------------- STORY_VIEWS POLICIES ---------------- */

-- Insert: viewers can record view
CREATE POLICY "allow_viewer_insert_story_views" ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Select: owner of story (to see analytics) or viewer themselves
CREATE POLICY "allow_owner_or_viewer_select_story_views" ON public.story_views FOR SELECT
  USING (
    auth.uid() = viewer_id OR
    auth.uid() = (SELECT user_id FROM public.stories WHERE id = story_id)
  ); 