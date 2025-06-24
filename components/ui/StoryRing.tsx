import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import { colors } from '@/constants/colors';

interface StoryRingProps {
  source: string;
  size?: number;
  style?: ViewStyle;
  hasStory?: boolean;
  isViewed?: boolean;
  isOnline?: boolean;
  showOnlineBadge?: boolean;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  source,
  size = 60,
  style,
  hasStory = false,
  isViewed = false,
  isOnline = false,
  showOnlineBadge = false,
}) => {
  if (!hasStory) {
    return (
      <Avatar 
        source={source} 
        size={size} 
        style={style} 
        showOnlineBadge={showOnlineBadge}
        isOnline={isOnline}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={isViewed ? [colors.inactive, colors.inactive] : ['#FCAF45', '#E1306C', '#833AB4']}
        style={[
          styles.ring,
          { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 },
        ]}
      >
        <View
          style={[
            styles.avatarContainer,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Avatar 
            source={source} 
            size={size - 4} 
            showOnlineBadge={showOnlineBadge}
            isOnline={isOnline}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});