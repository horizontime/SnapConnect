-- Migration: Add RLS policies for storage buckets

-- Note: Storage buckets must be created manually in Supabase dashboard first
-- This migration adds the RLS policies for those buckets

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for 'snaps' bucket: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to snaps" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'snaps');

-- Policy for 'snaps' bucket: Allow authenticated users to view/download
CREATE POLICY "Allow authenticated downloads from snaps" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'snaps');

-- Policy for 'snaps' bucket: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own snaps" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'snaps' AND auth.uid()::text = owner);

-- Policy for 'stories' bucket: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to stories" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'stories');

-- Policy for 'stories' bucket: Allow authenticated users to view/download
CREATE POLICY "Allow authenticated downloads from stories" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'stories');

-- Policy for 'stories' bucket: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own stories" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'stories' AND auth.uid()::text = owner);

-- Make buckets public (optional - remove if you want authenticated-only access)
-- This allows public URLs to work without authentication
UPDATE storage.buckets SET public = true WHERE name IN ('snaps', 'stories'); 