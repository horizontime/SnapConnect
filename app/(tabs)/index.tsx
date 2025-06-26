import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useChatStore } from '@/store/chatStore';
import { useSnapStore } from '@/store/snapStore';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useFriendStore } from '@/store/friendStore';
import { FriendListItem } from '@/components/friend/FriendListItem';
import { supabase } from '@/utils/supabase';
import SnapListItem from '@/components/snap/SnapListItem';
import { diagnoseSnapIssues } from '@/utils/debug';
import { FriendProfileModal } from '@/components/friend/FriendProfileModal';

type StoryListItem = {
  id: string;
  isCurrentUser?: boolean;
  username?: string;
  avatar?: string;
  hasStory?: boolean;
  viewed?: boolean;
  userId?: string;
};

export default function ChatsScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { getChatsWithUserData, fetchChats } = useChatStore();
  const { friends, fetchFriends } = useFriendStore();
  const { snaps, fetchSnaps, subscribeToSnaps } = useSnapStore();
  const [view, setView] = useState<'snaps' | 'chats' | 'friends'>("chats");
  const [refreshing, setRefreshing] = useState(false);
  
  // State for friend profile modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  
  const chatsWithUserData = getChatsWithUserData();
  
  const navigateToChat = (chatId: string, userId: string) => {
    router.push(`/chat/${chatId}?userId=${userId}`);
  };
  
  const navigateToCamera = () => {
    router.push('/(tabs)/camera');
  };

  const handleFriendPress = async (friendId: string) => {
    if (!userId) return;

    // Try to find an existing chat locally first
    let existingChat = chatsWithUserData.find(c => c.userId === friendId);

    // If not found locally, check Supabase directly (handles reversed user order)
    if (!existingChat) {
      const { data: rows } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`)
        .limit(1);

      if (rows && rows.length > 0) {
        existingChat = { id: rows[0].id.toString() } as any; // minimal shape
      }
    }

    let chatId = existingChat ? existingChat.id : '';

    // If still not found, create a new chat with deterministic ordering
    if (!chatId) {
      // Ensure deterministic participant order (lexicographical) to avoid duplicate pairs
      const [user1, user2] = userId < friendId ? [userId, friendId] : [friendId, userId];

      try {
        const { data, error } = await supabase
          .from('chats')
          .insert({ user1_id: user1, user2_id: user2 })
          .select('id')
          .single();

        if (error) throw error;

        chatId = data.id.toString();
        await fetchChats();
      } catch (err: any) {
        console.error('[CreateChat]', err.message);
        return;
      }
    }

    router.push(`/chat/${chatId}?userId=${friendId}` as any);
  };

  const openFriendProfile = async (friend: any) => {
    try {
      setSelectedProfile(null);
      setProfileModalVisible(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, about, favorite_woods, favorite_tools, favorite_projects')
        .eq('id', friend.id)
        .single();

      if (error) throw error;

      const profile = {
        id: data.id,
        username: data.username,
        displayName: data.display_name || data.username,
        avatar: data.avatar_url,
        about: data.about,
        favoriteWoods: data.favorite_woods || [],
        favoriteTools: data.favorite_tools || [],
        favoriteProjects: data.favorite_projects || [],
        isOnline: friend.isOnline,
      };

      setSelectedProfile(profile);
    } catch (err: any) {
      console.error('[openFriendProfile]', err.message);
      setProfileModalVisible(false);
    }
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedProfile(null);
  };

  const handleSendTextFromProfile = () => {
    if (!selectedProfile) return;
    closeProfileModal();
    handleFriendPress(selectedProfile.id);
  };

  const handleSendSnapFromProfile = () => {
    closeProfileModal();
    navigateToCamera();
  };

  // Load chats once on mount
  useEffect(() => {
    fetchChats();
    fetchFriends();
    if (userId) {
      console.log('[ChatsScreen] userId available, fetching and subscribing to snaps:', userId);
      fetchSnaps(userId);
      subscribeToSnaps(userId);
    } else {
      console.log('[ChatsScreen] No userId available yet');
    }
  }, [userId]);

  useEffect(() => {
    if (view === 'friends') {
      fetchFriends();
    } else if (view === 'snaps' && userId) {
      // Re-fetch snaps when switching to snaps view
      console.log('[ChatsScreen] Switching to snaps view, fetching snaps');
      fetchSnaps(userId);
    }
  }, [view, userId]);

  // Make diagnostic function available globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      (window as any).diagnoseSnaps = () => diagnoseSnapIssues(userId);
      console.log('[ChatsScreen] Diagnostic function available: window.diagnoseSnaps()');
    }
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (view === 'snaps' && userId) {
        await fetchSnaps(userId);
      } else if (view === 'chats') {
        await fetchChats();
      } else if (view === 'friends') {
        await fetchFriends();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const friendChats = friends
    .filter(f => !chatsWithUserData.some(c => c.user.id === f.id))
    .map(f => ({
      id: `friend-${f.id}`,
      userId: f.id,
      lastMessage: {
        type: 'text' as const,
        content: 'Say hi!',
        timestamp: new Date().toISOString(),
        isRead: true,
      },
      unreadCount: 0,
      user: f,
    }));

  const textChats = chatsWithUserData.filter(c => c.lastMessage.type === 'text');
  const displayChats = [...textChats, ...friendChats];

  // Build display snaps from snap store with sender info
  const displaySnaps = snaps.map(s => ({
    id: s.id,
    senderName: s.sender?.display_name || s.sender?.username || 'Unknown',
    senderUsername: s.sender?.username || '',
    senderAvatar: s.sender?.avatar || s.sender?.avatar_url || '',
    createdAt: s.created_at,
    type: s.type as 'image' | 'video',
  }));

  console.log('[ChatsScreen] Display snaps:', displaySnaps.length);

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'snaps' && styles.toggleButtonActive]}
          onPress={() => setView('snaps')}
        >
          <Text style={[styles.toggleText, view === 'snaps' && styles.toggleTextActive]}>Snaps</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'chats' && styles.toggleButtonActive]}
          onPress={() => setView('chats')}
        >
          <Text style={[styles.toggleText, view === 'chats' && styles.toggleTextActive]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'friends' && styles.toggleButtonActive]}
          onPress={() => setView('friends')}
        >
          <Text style={[styles.toggleText, view === 'friends' && styles.toggleTextActive]}>Friends</Text>
        </TouchableOpacity>
      </View>

      {view === 'snaps' ? (
        <FlatList
          data={displaySnaps}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SnapListItem
              id={item.id}
              senderName={item.senderName}
              senderUsername={item.senderUsername}
              senderAvatar={item.senderAvatar}
              createdAt={item.createdAt}
              type={item.type}
              onPress={() => router.push(`/snaps/${item.id}` as any)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No snaps</Text>
              <Text style={styles.emptySubtext}>Snaps you receive will appear here</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : view === 'chats' ? (
        <FlatList
          data={displayChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              id={item.id}
              username={item.user.username}
              displayName={item.user.displayName}
              avatar={item.user.avatar}
              lastMessage={item.lastMessage}
              unreadCount={item.unreadCount}
              isOnline={item.user.isOnline}
              onPress={() => {
                if (item.id.startsWith('friend-')) {
                  handleFriendPress(item.user.id);
                } else {
                  navigateToChat(item.id, item.user.id);
                }
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={() => null}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with a friend</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendListItem
              id={item.id}
              username={item.username}
              displayName={item.displayName}
              avatar={item.avatar}
              isOnline={item.isOnline}
              onPress={() => openFriendProfile(item)}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Search and add friends to start chatting</Text>
            </View>
          )}
        />
      )}

      <FriendProfileModal
        visible={profileModalVisible}
        profile={selectedProfile}
        onClose={closeProfileModal}
        onSendText={handleSendTextFromProfile}
        onSendSnap={handleSendSnapFromProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  toggleText: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 78,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});