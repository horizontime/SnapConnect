import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';

interface FriendListItemProps {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  onPress: () => void;
}

export const FriendListItem: React.FC<FriendListItemProps> = ({ username, displayName, avatar, isOnline, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar source={avatar} size={50} showOnlineBadge={true} isOnline={isOnline} />
      <View style={styles.textContainer}>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  textContainer: {
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textLight,
  },
}); 