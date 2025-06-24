import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useChatStore } from '@/store/chatStore';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StoryThumbnail } from '@/components/story/StoryThumbnail';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';

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

  // Load chats once on mount
  useEffect(() => {
    fetchChats();
  }, []);

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

  return (
    <View style={styles.container}>
      <FlatList
        data={chatsWithUserData}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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