import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { formatTimestamp } from '@/utils/timeUtils';
import { Camera } from 'lucide-react-native';

interface Props {
  id: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  createdAt: string;
  type: 'image' | 'video';
  onPress: () => void;
}

const SnapListItem: React.FC<Props> = ({
  senderName,
  senderUsername,
  senderAvatar,
  createdAt,
  type,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Avatar source={senderAvatar} size={50} showOnlineBadge={false} isOnline={false} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{senderName}</Text>
          <Text style={styles.time}>{formatTimestamp(createdAt)}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Camera size={16} color={colors.textLight} style={{ marginRight: 4 }} />
          <Text style={styles.label}>{type === 'video' ? 'Video Snap' : 'Photo Snap'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.textLight,
  },
});

export default SnapListItem; 