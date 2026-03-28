import { supabase } from '@/utils/supabase';

/**
 * Utility function to fix existing one-way friendships by making them bidirectional
 * This ensures that if A is friends with B, then B is also friends with A
 */
export async function fixOnewayFriendships(userId: string) {
  try {
    console.log('[FixFriendships] Starting to fix one-way friendships...');
    
    // Get all friendships where the current user is involved
    const { data: friendships, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    
    if (error) {
      console.error('[FixFriendships] Error fetching friendships:', error);
      return { success: false, error };
    }
    
    console.log('[FixFriendships] Found friendships:', friendships);
    
    let fixed = 0;
    
    // Check each friendship for missing reverse direction
    for (const friendship of friendships || []) {
      const reverseUserId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
      const reverseFriendId = friendship.user_id === userId ? userId : friendship.friend_id;
      
      // Check if reverse friendship exists
      const { data: reverseExists, error: checkError } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', reverseUserId)
        .eq('friend_id', reverseFriendId)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // No reverse friendship found, create it
        console.log(`[FixFriendships] Creating reverse friendship: ${reverseUserId} -> ${reverseFriendId}`);
        
        const { error: insertError } = await supabase
          .from('friends')
          .insert({ user_id: reverseUserId, friend_id: reverseFriendId });
        
        if (insertError && insertError.code !== '23505') {
          console.error('[FixFriendships] Error creating reverse friendship:', insertError);
        } else if (!insertError) {
          fixed++;
        }
      }
    }
    
    console.log(`[FixFriendships] Fixed ${fixed} one-way friendships`);
    return { success: true, fixed };
  } catch (error) {
    console.error('[FixFriendships] Unexpected error:', error);
    return { success: false, error };
  }
}

// Export a function that can be called from the browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).fixFriendships = async () => {
    const { userId } = await import('@/store/authStore').then(m => m.useAuthStore.getState());
    if (!userId) {
      console.error('No user logged in');
      return;
    }
    return fixOnewayFriendships(userId);
  };
} 