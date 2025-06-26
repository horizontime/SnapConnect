import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure you have these two variables defined in your .env or app.config.ts
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] URL or Anon Key is missing. Did you set your env vars?');
  
  // Hardcode values for web platform as a temporary workaround
  if (typeof window !== 'undefined') {
    console.warn('[Supabase] Using hardcoded values for web platform');
    supabaseUrl = 'https://dqytpwkrdjibqunucigc.supabase.co';
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeXRwd2tyZGppYnF1bnVjaWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDQ0MjMsImV4cCI6MjA2NjMyMDQyM30.YwIpswXekP1Vi8T753RAEzx7jmtYeOSeeKMCyj_cijU';
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
    const requiredBuckets = ['snaps', 'stories'];
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const existingBucketNames = buckets?.map((b) => b.name) ?? [];

    for (const bucketName of requiredBuckets) {
      if (!existingBucketNames.includes(bucketName)) {
        console.log(`[Supabase] Creating ${bucketName} bucket…`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          // 50 MB per file limit – videos can be bigger than images
          fileSizeLimit: bucketName === 'snaps' ? 104857600 /* 100 MB */ : 52428800 /* 50 MB */,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/quicktime',
          ],
        });

        if (createError && !createError.message.includes('already exists')) {
          console.error(`[Supabase] Error creating ${bucketName} bucket`, createError);
          return false;
        }

        console.log(`[Supabase] ${bucketName} bucket is ready`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in ensureMediaBuckets:', error);
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
  const fileName = fileUri.split('/').pop() || `${Date.now()}`;

  const fileRes = await fetch(fileUri);
  const blob = await fileRes.blob();

  const filePath = `${Date.now()}_${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error || !data?.path) {
    throw error || new Error('Failed to upload');
  }

  // Supabase JS v2 getPublicUrl
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error('Cannot resolve public URL');
  }

  // Progress: since we use fetch->blob, we cannot track native upload progress here.
  if (onProgress) onProgress(100);

  return { publicUrl: urlData.publicUrl, path: data.path };
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

  const expires_at = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

  const { error } = await supabase.from('snaps').insert({
    sender_id: senderId,
    recipient_ids: recipientIds,
    media_url: mediaUrl,
    type,
    overlay_meta: overlayMeta ?? null,
    expires_at,
  });

  if (error) throw error;
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
  expiresInHours?: number;
}) {
  const { userId, mediaUrl, thumbnailUrl, type, caption, metadata, expiresInHours = 24 } = params;

  const expires_at = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

  const { error } = await supabase.from('stories').insert({
    user_id: userId,
    media_url: mediaUrl,
    thumbnail_url: thumbnailUrl ?? null,
    type,
    caption: caption ?? null,
    metadata: metadata ?? null,
    expires_at,
  });

  if (error) throw error;
} 