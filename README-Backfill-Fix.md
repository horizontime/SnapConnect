# Fixing Embedding Backfill Issue

## The Problem

The original backfill scripts (`generate-story-embeddings.ts` and `generate-user-embeddings.ts`) report success but don't actually update the database. This is because:

1. **Row Level Security (RLS)**: Supabase tables have RLS enabled by default
2. **Anonymous Key**: The scripts use the anonymous key which is subject to RLS policies
3. **No UPDATE Policies**: There are no RLS policies allowing anonymous users to update embedding columns
4. **Silent Failures**: Supabase returns success even when RLS blocks the update

## The Solution

You have two options:

### Option 1: Use Service Role Key (Recommended for Backfill)

The service role key bypasses all RLS policies, allowing you to update any row.

1. **Get your service role key**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the `service_role` key (keep it secret!)
   - Add to `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. **Run the new backfill scripts**:
   ```bash
   # Backfill story embeddings
   bun scripts/backfill-story-embeddings.ts

   # Backfill user preference embeddings
   bun scripts/backfill-user-embeddings.ts
   ```

### Option 2: Apply RLS Migration

If you prefer not to use the service role key:

1. **Apply the RLS migration**:
   ```bash
   supabase db push
   ```

2. **Use authenticated requests** (requires modifying scripts to authenticate as each user)

## Why This Happens

When you use the anonymous key:
- SELECT operations work (if allowed by RLS)
- UPDATE operations appear to succeed but are silently blocked
- No error is returned, making it hard to diagnose

## Security Considerations

- **Service Role Key**: Keep it secret! Never expose it in client-side code
- **Use only for admin operations**: Backfills, migrations, etc.
- **In production**: Consider creating specific RLS policies for embedding updates

## Verifying Success

After running the backfill scripts, check your Supabase dashboard:
1. Go to Table Editor
2. Select `stories` or `profiles` table
3. Check the `embedding` or `preference_embedding` columns
4. They should now contain vector data (shown as `[...]` in the UI)

## Going Forward

New stories and user preference updates will work automatically because:
- They use authenticated requests (user is logged in)
- The app uses the user's auth token
- RLS policies allow users to update their own records 