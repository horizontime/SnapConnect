import { supabase } from '@/utils/supabase';

export async function debugStorageSetup() {
  console.log('=== Storage Debug Info ===');
  
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return;
    }
    console.log('✅ Supabase client initialized');
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ Authenticated as:', user.id);
    } else {
      console.log('⚠️  Not authenticated');
    }
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
    } else {
      console.log('✅ Buckets found:', buckets?.map(b => b.name).join(', ') || 'none');
      
      const userContentBucket = buckets?.find(b => b.name === 'user-content');
      if (userContentBucket) {
        console.log('✅ user-content bucket exists');
        console.log('   - Public:', userContentBucket.public);
        console.log('   - File size limit:', userContentBucket.file_size_limit);
      } else {
        console.log('⚠️  user-content bucket not found');
      }
    }
    
    // Test bucket access
    try {
      const { data, error } = await supabase.storage.from('user-content').list('avatars', {
        limit: 1,
      });
      
      if (error) {
        console.error('❌ Error accessing bucket:', error.message);
      } else {
        console.log('✅ Bucket accessible');
      }
    } catch (e) {
      console.error('❌ Exception accessing bucket:', e);
    }
    
    // Check environment variables
    console.log('\n=== Environment Variables ===');
    console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set');
    console.log('SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.log('=========================');
}

export function logImageUploadAttempt(uri: string, fileSize?: number) {
  console.log('\n=== Image Upload Attempt ===');
  console.log('URI:', uri);
  console.log('File extension:', uri.split('.').pop()?.toLowerCase());
  if (fileSize) {
    console.log('File size:', `${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  }
  console.log('Timestamp:', new Date().toISOString());
  console.log('===========================');
}

export const DEBUG_CONFIG = {
  ENABLED: true,
  LOG_SOCKET_EVENTS: true,
  LOG_STORE_UPDATES: true,
  LOG_API_CALLS: true,
  LOG_NAVIGATION: true,
  LOG_MEDIA_OPERATIONS: true,
};

// Test snap functionality
export async function testSnapFunctionality(userId: string, recipientId: string) {
  console.log('[DEBUG] Testing snap functionality...');
  
  try {
    // Test 1: Create a test snap
    console.log('[DEBUG] Test 1: Creating test snap');
    const { error: insertError } = await supabase
      .from('snaps')
      .insert({
        sender_id: userId,
        recipient_ids: [recipientId],
        media_url: 'https://example.com/test.jpg',
        type: 'image',
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });
    
    if (insertError) {
      console.error('[DEBUG] Failed to create test snap:', insertError);
      return;
    }
    console.log('[DEBUG] Test snap created successfully');
    
    // Test 2: Fetch snaps as recipient
    console.log('[DEBUG] Test 2: Fetching snaps as recipient');
    const { data: snaps, error: fetchError } = await supabase
      .from('snaps')
      .select('*')
      .contains('recipient_ids', [recipientId]);
    
    if (fetchError) {
      console.error('[DEBUG] Failed to fetch snaps:', fetchError);
    } else {
      console.log('[DEBUG] Fetched snaps:', snaps);
    }
    
    // Test 3: Test real-time subscription
    console.log('[DEBUG] Test 3: Testing real-time subscription');
    const channel = supabase
      .channel('test-snaps')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'snaps' },
        (payload) => {
          console.log('[DEBUG] Real-time event received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('[DEBUG] Subscription status:', status);
      });
    
    // Clean up
    setTimeout(() => {
      channel.unsubscribe();
    }, 5000);
    
  } catch (error) {
    console.error('[DEBUG] Test failed:', error);
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testSnapFunctionality = testSnapFunctionality;
}

export function debugLog(category: string, message: string, data?: any) {
  // ... existing code ...
}

// Diagnose snap issues
export async function diagnoseSnapIssues(userId: string) {
  console.log('[DEBUG] Diagnosing snap issues for user:', userId);
  
  try {
    // Test 1: Can we access profiles table?
    console.log('[DEBUG] Test 1: Checking profiles table access');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('[DEBUG] Cannot access profiles table:', profileError);
    } else {
      console.log('[DEBUG] Profile access OK:', profile);
    }
    
    // Test 2: Can we query snaps without join?
    console.log('[DEBUG] Test 2: Querying snaps without join');
    const { data: snaps, error: snapsError } = await supabase
      .from('snaps')
      .select('*')
      .contains('recipient_ids', [userId]);
    
    if (snapsError) {
      console.error('[DEBUG] Cannot query snaps:', snapsError);
    } else {
      console.log('[DEBUG] Found snaps:', snaps?.length || 0);
      if (snaps && snaps.length > 0) {
        console.log('[DEBUG] First snap:', snaps[0]);
      }
    }
    
    // Test 3: Try the join query
    console.log('[DEBUG] Test 3: Testing join query');
    const { data: snapsWithJoin, error: joinError } = await supabase
      .from('snaps')
      .select(`
        *,
        sender:profiles!sender_id (*)
      `)
      .contains('recipient_ids', [userId])
      .limit(1);
    
    if (joinError) {
      console.error('[DEBUG] Join query failed:', joinError);
      console.error('[DEBUG] Join error details:', {
        message: joinError.message,
        details: joinError.details,
        hint: joinError.hint,
        code: joinError.code
      });
    } else {
      console.log('[DEBUG] Join query succeeded:', snapsWithJoin);
    }
    
    // Test 4: Check if foreign key exists
    console.log('[DEBUG] Test 4: Checking foreign key constraint');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_foreign_keys', { table_name: 'snaps' });
    
    if (!constraintError && constraints) {
      console.log('[DEBUG] Foreign key constraints:', constraints);
    }
    
  } catch (error) {
    console.error('[DEBUG] Diagnosis failed:', error);
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).diagnoseSnapIssues = diagnoseSnapIssues;
} 