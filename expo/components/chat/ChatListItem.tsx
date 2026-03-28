import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { formatTimestamp } from '@/utils/timeUtils';
import { colors } from '@/constants/colors';
import { Camera } from 'lucide-react-native';

interface ChatListItemProps {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  lastMessage: {
    type: 'text' | 'image' | 'video';
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
  isOnline: boolean;
  onPress: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  username,
  displayName,
  avatar,
  lastMessage,
  unreadCount,
  isOnline,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar 
        source={avatar} 
        size={50} 
        showOnlineBadge={true}
        isOnline={isOnline}
      />
      
      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(lastMessage.timestamp)}</Text>
        </View>
        
        <View style={styles.bottomRow}>
          <View style={styles.messageContainer}>
            {lastMessage.type !== 'text' && (
              <Camera size={16} color={colors.textLight} style={styles.messageIcon} />
            )}
            <Text 
              style={[
                styles.message, 
                !lastMessage.isRead && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {lastMessage.content}
            </Text>
          </View>
          
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>
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
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageIcon: {
    marginRight: 4,
  },
  message: {
    fontSize: 14,
    color: colors.textLight,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
});