import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StoryThumbnail } from '@/components/story/StoryThumbnail';
import StoryCard from '@/components/story/StoryCard';
import { Plus } from 'lucide-react-native';

export default function StoriesScreen() {
  const router = useRouter();
  const { userId, avatar: userAvatar } = useAuthStore();
  const { getAllStories, fetchStories } = useStoryStore();
  
  // Get all stories and categorize them
  const allStories = getAllStories();
  
  // Filter stories into categories
  const myStories = userId ? allStories.filter((s: any) => s.userId === userId || s.user_id === userId) : [];
  const friendsStories = userId ? allStories.filter((s: any) => 
    (s.userId !== userId && s.user_id !== userId) && s.user?.isFriend
  ) : [];
  const otherStories = userId ? allStories.filter((s: any) => 
    (s.userId !== userId && s.user_id !== userId) && !s.user?.isFriend
  ) : allStories;
  
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

  const navigateToCamera = () => {
    router.push('/(tabs)/camera');
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Your Stories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <TouchableOpacity style={styles.addStoryButton} onPress={navigateToCamera}>
            <View style={styles.addIconContainer}>
              <Plus size={32} color={colors.primary} />
            </View>
            <Text style={styles.addStoryText}>Add Story</Text>
          </TouchableOpacity>
          
          {myStories.map((story: any) => {
            const preview = story.thumbnail_url || story.media_url || '';
            return (
              <View key={story.id} style={styles.storyItem}>
                <StoryThumbnail
                  id={story.id}
                  username="Your Story"
                  avatar={userAvatar ?? ''}
                  hasStory={true}
                  isViewed={false}
                  isCurrentUser={true}
                  onPress={() => navigateToStory(story.id)}
                />
                {(story.title || story.metadata?.title) && (
                  <Text style={styles.storyTitle} numberOfLines={1}>
                    {story.title || story.metadata?.title}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Friends' Stories Section */}
      {friendsStories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends' Stories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {friendsStories.map((story: any) => {
              const user = story.user;
              const preview = story.thumbnail_url || story.media_url || '';
              if (!user || !preview) return null;
              
              return (
                <View key={story.id} style={styles.storyItem}>
                  <StoryThumbnail
                    id={story.id}
                    username={user.display_name || user.username}
                    avatar={user.avatar_url || ''}
                    hasStory={true}
                    isViewed={story.viewed}
                    onPress={() => navigateToStory(story.id)}
                  />
                  {(story.title || story.metadata?.title) && (
                    <Text style={styles.storyTitle} numberOfLines={1}>
                      {story.title || story.metadata?.title}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Recommended Stories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended</Text>
        {otherStories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stories to show</Text>
            <Text style={styles.emptySubtext}>Discover new stories from the community</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {otherStories.map((story: any) => {
              const user = story.user;
              const preview = story.thumbnail_url || story.media_url || '';
              if (!user || !preview) return null;
              
              return (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  username={user.display_name || user.username}
                  avatar={user.avatar_url || ''}
                  previewUrl={preview}
                  hasStory={true}
                  isViewed={story.viewed}
                  onPress={() => navigateToStory(story.id)}
                  title={story.title || story.metadata?.title}
                  description={story.description || story.metadata?.description}
                />
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 16,
  },
  horizontalScroll: {
    paddingHorizontal: 12,
  },
  storyItem: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  storyTitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    width: 72,
    textAlign: 'center',
  },
  addStoryButton: {
    width: 72,
    height: 72,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addStoryText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
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