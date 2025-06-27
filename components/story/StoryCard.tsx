import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
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
  title?: string;
  description?: string;
}

const StoryCard: React.FC<Props> = ({ id, username, avatar, previewUrl, hasStory, isViewed, onPress, title, description }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {imageLoading && !imageError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      
      {!imageError ? (
        <Image 
          source={{ uri: previewUrl }} 
          style={styles.preview} 
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load</Text>
        </View>
      )}
      
      <View style={styles.gradient} />
      <View style={styles.overlay}>
        <StoryRing source={avatar} size={40} hasStory={hasStory} isViewed={isViewed} />
        <Text style={styles.name} numberOfLines={1}>{username}</Text>
      </View>
      {(title || description) && (
        <View style={styles.textOverlay}>
          {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
          {description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Calculate card size based on screen width
const { width: screenWidth } = Dimensions.get('window');
const PADDING = 16; // Total horizontal padding
const GAP = 8; // Gap between cards
const COLUMNS = 2; // Number of columns on mobile
const CARD_SIZE = (screenWidth - PADDING - (GAP * (COLUMNS - 1))) / COLUMNS;

const styles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: GAP / 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  textOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
  },
  title: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: colors.card,
    fontSize: 12,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StoryCard; 