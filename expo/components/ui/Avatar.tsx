import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';

interface AvatarProps {
  source: string;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
  showOnlineBadge?: boolean;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 40,
  style,
  showBorder = false,
  showOnlineBadge = false,
  isOnline = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatarContainer,
          showBorder && styles.border,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Image
          source={source}
          style={[
            styles.avatar,
            { width: showBorder ? size - 4 : size, height: showBorder ? size - 4 : size, borderRadius: size / 2 },
          ]}
          contentFit="cover"
          transition={200}
        />
      </View>
      
      {showOnlineBadge && (
        <View
          style={[
            styles.onlineBadge,
            { backgroundColor: isOnline ? colors.success : colors.inactive },
            { right: 0, bottom: 0, width: size / 4, height: size / 4 },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    backgroundColor: colors.border,
  },
  border: {
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
  },
  onlineBadge: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
});