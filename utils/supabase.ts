import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // we'll just verify they exist by trying to get their details
    const requiredBuckets = ['snaps', 'stories'];
    
    for (const bucketName of requiredBuckets) {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error) {
        console.warn(`[Supabase] ${bucketName} bucket not accessible:`, error.message);
        console.log(`[Supabase] Please create the ${bucketName} bucket manually in the Supabase dashboard`);
        console.log(`[Supabase] Make it public and add appropriate RLS policies`);
      } else {
        console.log(`[Supabase] ✓ ${bucketName} bucket is ready`);
      }
    }

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