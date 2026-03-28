import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StoryThumbnail } from '@/components/story/StoryThumbnail';
import StoryCard from '@/components/story/StoryCard';
import { Plus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function StoriesScreen() {
  const router = useRouter();
  const { userId, avatar: userAvatar } = useAuthStore();
  const { getAllStories, fetchStories, fetchRecommendedStories, recommendedStories } = useStoryStore();
  const [activeFilter, setActiveFilter] = useState<'recommended' | 'latest'>('recommended');
  
  // Get all stories and categorize them
  const allStories = getAllStories();
  
  // Filter stories into categories
  const myStories = userId ? allStories.filter((s: any) => s.userId === userId || s.user_id === userId) : [];
  const friendsStories = userId ? allStories.filter((s: any) => 
    (s.userId !== userId && s.user_id !== userId) && s.user?.isFriend
  ) : [];
  
  // Get other stories based on active filter
  const getOtherStories = () => {
    const baseOtherStories = userId ? allStories.filter((s: any) => 
      (s.userId !== userId && s.user_id !== userId) && !s.user?.isFriend
    ) : allStories;
    
    if (activeFilter === 'latest') {
      // Sort by most recent date first
      return [...baseOtherStories].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    } else {
      // Use recommended stories if available and filter out friends
      const hasRecommendations = recommendedStories && recommendedStories.length > 0;

      // Helper to ensure we never leak friend stories into this list
      const filterNonFriendStories = (storiesArr: any[]) =>
        storiesArr.filter((s: any) =>
          (s.userId !== userId && s.user_id !== userId) && !s.user?.isFriend
        );

      return hasRecommendations
        ? filterNonFriendStories(recommendedStories)
        : baseOtherStories;
    }
  };
  
  const otherStories = getOtherStories();
  
  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchStories(userId ?? undefined);
    if (userId) {
      // Fetch recommended stories based on user preferences
      fetchRecommendedStories(userId);
      
      import('@/store/storyStore').then(({ useStoryStore }) => {
        useStoryStore.getState().subscribeToRealtime(userId);
      });
    }
  }, [userId]);
  
  // Refresh stories whenever the tab is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchStories(userId ?? undefined);
      if (userId) {
        fetchRecommendedStories(userId);
      }
    }, [userId])
  );
  
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
        <View style={styles.sectionHeader}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'recommended' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('recommended')}
          >
            <Text style={[styles.filterButtonText, activeFilter === 'recommended' && styles.filterButtonTextActive]}>
              Recommended for you
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'latest' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('latest')}
          >
            <Text style={[styles.filterButtonText, activeFilter === 'latest' && styles.filterButtonTextActive]}>
              Latest Stories
            </Text>
          </TouchableOpacity>
        </View>
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
    height: 90,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
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
    marginTop: 6,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
});