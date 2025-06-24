import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StoryRing } from '@/components/ui/StoryRing';
import { colors } from '@/constants/colors';

interface StoryThumbnailProps {
  id: string;
  username: string;
  avatar: string;
  hasStory: boolean;
  isViewed: boolean;
  isCurrentUser?: boolean;
  onPress: () => void;
}

export const StoryThumbnail: React.FC<StoryThumbnailProps> = ({
  username,
  avatar,
  hasStory,
  isViewed,
  isCurrentUser = false,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <StoryRing
        source={avatar}
        size={60}
        hasStory={hasStory}
        isViewed={isViewed}
      />
      <Text style={styles.username} numberOfLines={1}>
        {isCurrentUser ? 'Your Story' : username}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  username: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
});