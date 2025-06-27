import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StoryRing } from '@/components/ui/StoryRing';
import { colors } from '@/constants/colors';
import { X } from 'lucide-react-native';
import { useStoryStore } from '@/store/storyStore';

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
  id,
  username,
  avatar,
  hasStory,
  isViewed,
  isCurrentUser = false,
  onPress,
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const { deleteStory } = useStoryStore();

  const handleLongPress = () => {
    if (isCurrentUser) {
      setShowDelete(true);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowDelete(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteStory(id);
            if (success) {
              setShowDelete(false);
            } else {
              Alert.alert('Error', 'Failed to delete story. Please try again.');
              setShowDelete(false);
            }
          },
        },
      ],
    );
  };

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.storyContainer}>
        <StoryRing
          source={avatar}
          size={60}
          hasStory={hasStory}
          isViewed={isViewed}
        />
        {showDelete && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <X size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
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
  storyContainer: {
    position: 'relative',
  },
  username: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});