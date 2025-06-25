import { supabase } from './supabase';

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