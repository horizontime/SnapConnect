import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Ensure you have these two variables defined in your .env or app.config.js
import Constants from 'expo-constants';

let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Fall back to Constants.expoConfig.extra if env vars are not set
if (!supabaseUrl || !supabaseAnonKey) {
  const extra = Constants.expoConfig?.extra;
  if (extra?.supabaseUrl && extra?.supabaseAnonKey) {
    supabaseUrl = extra.supabaseUrl;
    supabaseAnonKey = extra.supabaseAnonKey;
    console.log('[Supabase] Using values from app.config.js');
  } else {
    console.warn('[Supabase] URL or Anon Key is missing. Did you set your env vars?');
    
    // Hardcode values as last resort
    supabaseUrl = 'https://dqytpwkrdjibqunucigc.supabase.co';
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeXRwd2tyZGppYnF1bnVjaWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDQ0MjMsImV4cCI6MjA2NjMyMDQyM30.YwIpswXekP1Vi8T753RAEzx7jmtYeOSeeKMCyj_cijU';
    console.warn('[Supabase] Using hardcoded values as fallback');
  }
}

// Custom WebSocket for web platform to ensure proper connection
const CustomWebSocket = typeof window !== 'undefined' 
  ? class extends WebSocket {
      constructor(url: string, protocols?: string | string[]) {
        // Always use the browser's native WebSocket without modifications
        super(url, protocols);
      }
    }
  : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    // @ts-ignore - transport option exists but not in types
    transport: CustomWebSocket,
  },
}); 

// Helper function to ensure storage bucket exists
export async function ensureMediaBuckets() {
  try {
    // Since buckets are created manually in Supabase dashboard,
    // we'll verify they're accessible by trying a simple operation
    const requiredBuckets = ['snaps', 'stories'];
    
    for (const bucketName of requiredBuckets) {
      // Try to list files in the bucket (empty result is fine, we just want to check access)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (error) {
        console.warn(`[Supabase] ${bucketName} bucket check failed:`, error.message);
        // If the error is about the bucket not existing, provide guidance
        if (error.message.includes('not found')) {
          console.log(`[Supabase] Please create the ${bucketName} bucket in the Supabase dashboard`);
          console.log(`[Supabase] Make it public and add INSERT/SELECT RLS policies`);
        }
      } else {
        console.log(`[Supabase] ✓ ${bucketName} bucket is ready`);
      }
    }

    console.log('[Supabase] Storage initialization complete');
    return true;
  } catch (error) {
    console.error('Error checking buckets:', error);
    return false;
  }
}

// 🛑 DEPRECATED: kept for backward-compatibility with legacy calls
export const ensureStorageBucket = ensureMediaBuckets;

/** -----------------------------------------
 * Upload Helpers (Phase 4)
 * -----------------------------------------*/

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload a local file (photo or video) to the specified storage bucket.
 * Returns the public URL on success.
 */
export async function uploadMedia(
  bucket: 'snaps' | 'stories',
  fileUri: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  console.log(`[uploadMedia] Starting upload to ${bucket} bucket`);
  console.log(`[uploadMedia] File URI: ${fileUri}`);
  console.log(`[uploadMedia] Supabase URL: ${supabaseUrl}`);
  
  const fileName = fileUri.split('/').pop() || `${Date.now()}`;

  try {
    // First, verify the file exists
    console.log(`[uploadMedia] Checking if file exists...`);
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (!fileInfo.exists) {
      throw new Error(`File not found at URI: ${fileUri}`);
    }
    
    console.log(`[uploadMedia] File exists. Size: ${fileInfo.size} bytes`);
    
    // Determine content type based on file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // default
    if (fileExtension === 'png') contentType = 'image/png';
    else if (fileExtension === 'mp4') contentType = 'video/mp4';
    else if (fileExtension === 'mov') contentType = 'video/quicktime';
    
    console.log(`[uploadMedia] Content type: ${contentType}`);

    const filePath = `${Date.now()}_${fileName}`;
    console.log(`[uploadMedia] Uploading to path: ${filePath}`);

    // Check if bucket is accessible first
    const { data: listData, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });
    
    if (listError) {
      console.error(`[uploadMedia] Bucket access check failed:`, listError);
      throw new Error(`Cannot access ${bucket} bucket: ${listError.message}`);
    }
    
    console.log(`[uploadMedia] Bucket ${bucket} is accessible`);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('', {
      uri: fileUri,
      name: fileName,
      type: contentType,
    } as any);

    // Upload using the Supabase storage API's REST endpoint directly
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;
    console.log(`[uploadMedia] Uploading to URL: ${uploadUrl}`);

    // Use the logged-in user's JWT so that the request runs as the
    // "authenticated" role and passes RLS checks. If no session is
    // available yet (e.g. user not logged in), fall back to the anon key.

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token ?? supabaseAnonKey;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[uploadMedia] Upload failed with status ${uploadResponse.status}: ${errorText}`);
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    console.log(`[uploadMedia] Upload successful`);

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Cannot resolve public URL');
    }

    console.log(`[uploadMedia] Public URL: ${urlData.publicUrl}`);

    // Progress: since we use fetch->blob, we cannot track native upload progress here.
    if (onProgress) onProgress(100);

    return { publicUrl: urlData.publicUrl, path: filePath };
  } catch (error) {
    console.error(`[uploadMedia] Error details:`, error);
    if (error instanceof Error) {
      console.error(`[uploadMedia] Error message: ${error.message}`);
      console.error(`[uploadMedia] Error stack:`, error.stack);
    }
    throw error;
  }
}

/**
 * Insert a row into `snaps` table.
 */
export async function createSnap(params: {
  senderId: string;
  recipientIds: string[];
  mediaUrl: string;
  type: 'image' | 'video';
  overlayMeta?: any;
  expiresInHours?: number;
}) {
  const { senderId, recipientIds, mediaUrl, type, overlayMeta, expiresInHours = 24 } = params;

  console.log('[createSnap] Creating snap with params:', {
    senderId,
    recipientIds,
    mediaUrl,
    type,
    overlayMeta,
    expiresInHours
  });

  const expires_at = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

  const insertData = {
    sender_id: senderId,
    recipient_ids: recipientIds,
    media_url: mediaUrl,
    type,
    overlay_meta: overlayMeta ?? null,
    expires_at,
  };

  console.log('[createSnap] Inserting data:', insertData);

  const { error } = await supabase.from('snaps').insert(insertData);

  if (error) {
    console.error('[createSnap] Database insert failed:', error);
    console.error('[createSnap] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('[createSnap] Snap created successfully');
}

/**
 * Insert a snap into the `stories` table.
 */
export async function createStory(params: {
  userId: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  caption?: string;
  metadata?: any;
  title?: string;
  description?: string;
  expiresInHours?: number;
}) {
  const { userId, mediaUrl, thumbnailUrl, type, caption, metadata, title, description, expiresInHours = 24 } = params;

  const expires_at = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

  const insertData = {
    user_id: userId,
    media_url: mediaUrl,
    thumbnail_url: thumbnailUrl ?? null,
    type,
    caption: caption ?? null,
    metadata: metadata ?? null,
    title: title ?? null,
    description: description ?? null,
    expires_at,
  };

  console.log('[createStory] Inserting story with data:', insertData);

  const { error } = await supabase.from('stories').insert(insertData);

  if (error) {
    console.error('[createStory] Database insert failed:', error);
    console.error('[createStory] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('[createStory] Story created successfully');
}

/**
 * Test Supabase connection and log diagnostic information
 */
export async function testSupabaseConnection() {
  console.log('[Network Test] Starting Supabase connection test...');
  console.log('[Network Test] Supabase URL:', supabaseUrl);
  
  try {
    // Test 1: Check storage bucket access
    console.log('[Network Test] Test 1: Checking storage buckets...');
    const buckets = ['snaps', 'stories'];
    
    for (const bucket of buckets) {
      const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      
      if (error) {
        console.error(`[Network Test] ✗ ${bucket} bucket error:`, error.message);
        console.error(`[Network Test] ${bucket} bucket error details:`, error);
      } else {
        console.log(`[Network Test] ✓ ${bucket} bucket is accessible`);
      }
    }
    
    // Test 2: Check database access
    console.log('[Network Test] Test 2: Checking database access...');
    const { error: dbError } = await supabase.from('snaps').select('id').limit(1);
    
    if (dbError) {
      console.error('[Network Test] ✗ Database error:', dbError.message);
      console.error('[Network Test] Database error details:', dbError);
    } else {
      console.log('[Network Test] ✓ Database is accessible');
    }
    
    // Test 3: Check auth status
    console.log('[Network Test] Test 3: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('[Network Test] Auth check failed:', authError.message);
    } else {
      console.log('[Network Test] ✓ Authentication working. User:', user?.id || 'No user logged in');
    }
    
    console.log('[Network Test] All tests completed');
    return true;
    
  } catch (error) {
    console.error('[Network Test] Connection test failed:', error);
    return false;
  }
}