import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useChatStore } from '@/store/chatStore';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StoryThumbnail } from '@/components/story/StoryThumbnail';
import { useStoryStore } from '@/store/storyStore';
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
  const { getStoriesWithUserData, getMyStories } = useStoryStore();
  const { friends, fetchFriends } = useFriendStore();
  const [view, setView] = useState<'chats' | 'friends'>('chats');
  
  const chatsWithUserData = getChatsWithUserData();
  const storiesWithUserData = getStoriesWithUserData();
  const myStories = userId ? getMyStories(userId) : [];
  
  const navigateToChat = (chatId: string, userId: string) => {
    router.push(`/chat/${chatId}?userId=${userId}`);
  };
  
  const navigateToStory = (storyId: string) => {
    router.push(`/story/${storyId}`);
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

  const storyListData: StoryListItem[] = [
    { id: 'my-story', isCurrentUser: true },
    ...storiesWithUserData
      .filter(story => story.userId !== userId)
      .map(story => ({
        id: story.id,
        username: story.user.username,
        avatar: story.user.avatar,
        hasStory: true,
        viewed: story.viewed,
        userId: story.userId,
      })),
  ];

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

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
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

      {view === 'chats' ? (
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
              onPress={() => navigateToChat(item.id, item.user.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={() => (
            <View style={styles.storiesContainer}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={storyListData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  if (item.isCurrentUser) {
                    const hasMyStory = myStories.length > 0;
                    return (
                      <StoryThumbnail
                        id="my-story"
                        username="Your Story"
                        avatar={userId ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' : ''}
                        hasStory={hasMyStory}
                        isViewed={false}
                        isCurrentUser={true}
                        onPress={hasMyStory ? () => navigateToStory(myStories[0].id) : navigateToCamera}
                      />
                    );
                  }
                  
                  return (
                    <StoryThumbnail
                      id={item.id}
                      username={item.username || 'User'}
                      avatar={item.avatar || ''}
                      hasStory={item.hasStory || false}
                      isViewed={item.viewed || false}
                      onPress={() => navigateToStory(item.id)}
                    />
                  );
                }}
                contentContainerStyle={styles.storiesList}
              />
            </View>
          )}
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
  storiesContainer: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    marginBottom: 8,
  },
  storiesList: {
    paddingHorizontal: 8,
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