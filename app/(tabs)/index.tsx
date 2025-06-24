import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useChatStore } from '@/store/chatStore';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useFriendStore } from '@/store/friendStore';
import { FriendListItem } from '@/components/friend/FriendListItem';
import { supabase } from '@/utils/supabase';

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
  const [view, setView] = useState<'snaps' | 'chats' | 'friends'>("chats");
  
  const chatsWithUserData = getChatsWithUserData();
  
  const navigateToChat = (chatId: string, userId: string) => {
    router.push(`/chat/${chatId}?userId=${userId}`);
  };
  
  const navigateToCamera = () => {
    router.push('/(tabs)/camera');
  };

  const handleFriendPress = async (friendId: string) => {
    let existingChat = chatsWithUserData.find(chat => chat.userId === friendId);
    let chatId: string = existingChat ? existingChat.id : '';

    if (!existingChat) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .insert({ user1_id: userId, user2_id: friendId })
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

  // Load chats once on mount
  useEffect(() => {
    fetchChats();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (view === 'friends') {
      fetchFriends();
    }
  }, [view]);

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

  const displayChats = [...chatsWithUserData, ...friendChats];

  const snaps = chatsWithUserData.filter(c => c.lastMessage.type !== 'text');

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
          data={snaps}
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
              onPress={() => navigateToChat(item.id, item.user.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No snaps</Text>
              <Text style={styles.emptySubtext}>Snaps you receive will appear here</Text>
            </View>
          )}
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
              onPress={() => handleFriendPress(item.id)}
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