import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useFriendStore } from '@/store/friendStore';
import { useStoryStore } from '@/store/storyStore';
import { fixOnewayFriendships } from '@/utils/fixFriendships';
import { supabase } from '@/utils/supabase';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react-native';
import { User } from '@/types';

// Debug function to check friends table RLS status
async function checkFriendsTableStatus() {
  try {
    // Try to query the friends table
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('[Debug] Friends table query error:', error);
      console.error('[Debug] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('[Debug] Friends table is accessible, sample data:', data);
    }
  } catch (e) {
    console.error('[Debug] Exception checking friends table:', e);
  }
}

export default function RemoveFriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { friends, fetchFriends, removeFriend } = useFriendStore();
  const { fetchStories } = useStoryStore();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const initializeFriends = async () => {
      // First fix any one-way friendships
      if (userId) {
        console.log('[RemoveFriends] Fixing one-way friendships...');
        await fixOnewayFriendships(userId);
      }
      // Then fetch the updated friends list
      await fetchFriends();
      // Debug: Check friends table status
      checkFriendsTableStatus();
    };
    
    initializeFriends();
  }, [userId]);

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      }
      return [...prev, friendId];
    });
  };

  const handleRemoveSelected = async () => {
    if (selectedFriends.length === 0) return;

    const friendCount = selectedFriends.length;
    const message = friendCount === 1 
      ? 'Are you sure you want to remove this friend?' 
      : `Are you sure you want to remove ${friendCount} friends?`;

    Alert.alert(
      'Remove Friends',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(true);
            try {
              // First, let's check what friendships exist
              const { data: existingFriendships, error: checkError } = await supabase
                .from('friends')
                .select('*')
                .or(`and(user_id.eq.${userId},friend_id.in.(${selectedFriends.join(',')})),and(friend_id.eq.${userId},user_id.in.(${selectedFriends.join(',')}))`);
              
              console.log('[RemoveFriend] Existing friendships before deletion:', existingFriendships);
              
              if (checkError) {
                console.error('[RemoveFriend] Error checking friendships:', checkError);
              }
              
              // Remove each selected friend
              for (const friendId of selectedFriends) {
                console.log(`[RemoveFriend] Removing friendship between ${userId} and ${friendId}`);
                
                // Delete both possible directions of the friendship
                // First try: current user as user_id
                const { error: error1, count: count1 } = await supabase
                  .from('friends')
                  .delete({ count: 'exact' })
                  .eq('user_id', userId)
                  .eq('friend_id', friendId);

                console.log(`[RemoveFriend] Delete user->friend result:`, { error: error1, count: count1 });

                // Second try: current user as friend_id
                const { error: error2, count: count2 } = await supabase
                  .from('friends')
                  .delete({ count: 'exact' })
                  .eq('user_id', friendId)
                  .eq('friend_id', userId);

                console.log(`[RemoveFriend] Delete friend->user result:`, { error: error2, count: count2 });

                // If both queries failed, throw error
                if (error1 && error2) {
                  console.error('[RemoveFriend] Both delete queries failed');
                  throw new Error('Failed to remove friendship - database error');
                }
                
                // If no records were deleted but no errors, the friendship might already be gone
                if (count1 === 0 && count2 === 0 && !error1 && !error2) {
                  console.warn('[RemoveFriend] No friendship records found to delete - may already be removed');
                }

                // Update local store regardless (to ensure UI consistency)
                removeFriend(friendId);
              }

              // Small delay to ensure database changes propagate
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh the friends list to ensure UI is updated
              console.log('[RemoveFriend] Refreshing friends list...');
              await fetchFriends();
              
              // Log the updated friends list
              const updatedFriends = useFriendStore.getState().friends;
              console.log('[RemoveFriend] Updated friends:', updatedFriends.map(f => ({ id: f.id, username: f.username })));
              
              // Also refresh stories to update their friend status
              console.log('[RemoveFriend] Refreshing stories...');
              await fetchStories(userId ?? undefined);
              
              Alert.alert(
                'Success', 
                friendCount === 1 
                  ? 'Friend removed successfully' 
                  : `${friendCount} friends removed successfully`
              );
              
              // Clear selection and go back
              setSelectedFriends([]);
              router.back();
            } catch (error: any) {
              console.error('[RemoveFriends] Error:', error);
              Alert.alert('Error', 'Failed to remove friends. Please try again.');
            } finally {
              setIsRemoving(false);
            }
          }
        }
      ]
    );
  };

  const renderFriend = ({ item }: { item: User }) => {
    const isSelected = selectedFriends.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => handleSelectFriend(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.friendInfo}>
          <Avatar source={item.avatar} size={48} />
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.displayName}</Text>
            <Text style={styles.friendUsername}>
              {item.username.includes('@') ? item.username : `@${item.username}`}
            </Text>
          </View>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color={colors.card} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selected count */}
      {selectedFriends.length > 0 && (
        <View style={styles.selectedBar}>
          <Text style={styles.selectedText}>
            {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {/* Friends list */}
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>Add some friends first!</Text>
          </View>
        }
      />

      {/* Remove button */}
      {selectedFriends.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}>
          <Button
            title={isRemoving ? 'Removing...' : 'Remove Selected'}
            variant="primary"
            onPress={handleRemoveSelected}
            disabled={isRemoving}
            fullWidth
            style={{ backgroundColor: colors.danger }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectedBar: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background,
  },
  friendItemSelected: {
    backgroundColor: colors.lightGray,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendDetails: {
    marginLeft: 12,
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  friendUsername: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.card,
  },
}); 