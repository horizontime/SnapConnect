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