import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StoryThumbnail } from '@/components/story/StoryThumbnail';
import StoryCard from '@/components/story/StoryCard';

export default function StoriesScreen() {
  const router = useRouter();
  const { userId, avatar: userAvatar } = useAuthStore();
  const { getFriendsStories, fetchStories, getMyStories } = useStoryStore();
  
  // Only include stories that contain at least one item to avoid runtime errors
  const friendsStories = userId
    ? getFriendsStories(userId)
        .filter((s) => s.items && s.items.length > 0)
        .sort((a, b) => {
          if (a.viewed !== b.viewed) return a.viewed ? 1 : -1; // unviewed first
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        })
    : [];
  
  const myStories = userId ? getMyStories(userId) : [];
  
  useEffect(() => {
    fetchStories(userId ?? undefined);
    if (userId) {
      import('@/store/storyStore').then(({ useStoryStore }) => {
        useStoryStore.getState().subscribeToRealtime(userId);
      });
    }
  }, [userId]);
  
  const navigateToStory = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        data={friendsStories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => {
          const firstItem = item.items?.[item.items.length - 1];
          const preview = firstItem?.url || (item as any).thumbnail_url || (item as any).media_url || '';
          if (!preview) return null;
          return (
            <StoryCard
              id={item.id}
              username={item.user.displayName}
              avatar={item.user.avatar}
              previewUrl={preview}
              hasStory={true}
              isViewed={item.viewed}
              onPress={() => navigateToStory(item.id)}
            />
          );
        }}
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
            <StoryThumbnail
              id="my-story"
              username="Your Story"
              avatar={userAvatar ?? ''}
              hasStory={myStories.length > 0}
              isViewed={false}
              isCurrentUser={true}
              onPress={() => {
                if (myStories.length === 0) {
                  router.push('/(tabs)/camera');
                } else {
                  navigateToStory(myStories[0].id);
                }
              }}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stories yet</Text>
            <Text style={styles.emptySubtext}>Your friends' stories will appear here</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  headerContainer: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
});