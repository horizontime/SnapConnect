import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Image } from 'react-native';
import { useStoryStore } from '@/store/storyStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { formatStoryTimestamp } from '@/utils/timeUtils';

export default function StoriesScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { getFriendsStories, fetchStories } = useStoryStore();
  
  // Only include stories that contain at least one item to avoid runtime errors
  const friendsStories = userId
    ? getFriendsStories(userId).filter((story) => story.items && story.items.length > 0)
    : [];
  
  useEffect(() => {
    fetchStories();
  }, []);
  
  const navigateToStory = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        data={friendsStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Safeguard against stories that somehow passed the filter but still have no items
          const firstItem = item.items?.[0];
          if (!firstItem) return null;

          return (
            <TouchableOpacity
              style={styles.storyCard}
              onPress={() => navigateToStory(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.storyHeader}>
                <Avatar
                  source={item.user.avatar}
                  size={40}
                  showOnlineBadge={true}
                  isOnline={item.user.isOnline}
                />
                <View style={styles.storyInfo}>
                  <Text style={styles.username}>{item.user.displayName}</Text>
                  <Text style={styles.timestamp}>
                    {formatStoryTimestamp(item.lastUpdated)}
                  </Text>
                </View>
              </View>

              <View style={styles.storyPreview}>
                <Image
                  source={{ uri: firstItem.url }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                {firstItem.caption && (
                  <View style={styles.captionContainer}>
                    <Text style={styles.caption} numberOfLines={2}>
                      {firstItem.caption}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stories yet</Text>
            <Text style={styles.emptySubtext}>Your friends' stories will appear here</Text>
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
  listContent: {
    padding: 16,
  },
  storyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  storyInfo: {
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  storyPreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.border,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
  },
  caption: {
    color: colors.card,
    fontSize: 14,
  },
  separator: {
    height: 16,
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
});