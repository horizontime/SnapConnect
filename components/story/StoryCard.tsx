import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StoryRing } from '@/components/ui/StoryRing';
import { colors } from '@/constants/colors';

interface Props {
  id: string;
  username: string;
  avatar: string;
  previewUrl: string;
  hasStory: boolean;
  isViewed: boolean;
  onPress: () => void;
}

const StoryCard: React.FC<Props> = ({ id, username, avatar, previewUrl, hasStory, isViewed, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: previewUrl }} style={styles.preview} />
      <View style={styles.overlay}>
        <StoryRing source={avatar} size={40} hasStory={hasStory} isViewed={isViewed} />
        <Text style={styles.name} numberOfLines={1}>{username}</Text>
      </View>
    </TouchableOpacity>
  );
};

const CARD_SIZE = (Math.floor(100) / 100); // placeholder

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    alignItems: 'center',
  },
  name: {
    color: colors.card,
    fontSize: 12,
    marginTop: 2,
  },
});

export default StoryCard; 