import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Platform,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, Send, Check } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { uploadMedia, createSnap } from '@/utils/supabase';

// Video preview component using expo-video
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      style={styles.preview}
      player={player}
      contentFit="cover"
    />
  );
}

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ screen?: string; mode?: string; mediaUri?: string; mediaType?: string; overlayMeta?: string }>();
  
  // Debug logging to see what params are received
  console.log('Modal params:', {
    screen: params.screen,
    mode: params.mode,
    mediaUri: params.mediaUri,
    mediaType: params.mediaType,
    overlayMeta: params.overlayMeta,
  });
  console.log('Raw params object:', params);
  console.log('All param keys:', Object.keys(params));
  
  // Check both screen and mode parameters
  const shouldShowFriends = params.screen === 'selectFriends' || params.mode === 'selectFriends';
  
  // If not showing friend selection, show default modal
  if (!shouldShowFriends) {
    console.log('Not selectFriends, showing default modal. Screen param:', params.screen, 'Mode param:', params.mode);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <View style={styles.separator} />
        <Text>This is an example modal. You can edit it in app/modal.tsx.</Text>
        <Text>Screen param: {params.screen || 'undefined'}</Text>
        <Text>Mode param: {params.mode || 'undefined'}</Text>
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      </View>
    );
  }

  console.log('Showing SelectFriendsScreen');
  return <SelectFriendsScreen />;
}

function SelectFriendsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mediaUri?: string; mediaType?: string; overlayMeta?: string }>();
  const { friends, fetchFriends } = useFriendStore();
  const { userId } = useAuthStore();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      }
      return [...prev, friendId];
    });
  };

  const handleSend = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Select Friends', 'Please select at least one friend to send to');
      return;
    }

    if (!params.mediaUri || !params.mediaType || !userId) {
      Alert.alert('Error', 'Missing media or user');
      return;
    }

    setIsSending(true);

    try {
      // Upload media to snaps bucket
      const { publicUrl } = await uploadMedia('snaps', params.mediaUri);

      // Parse overlay metadata if provided
      let meta: any = null;
      if (params.overlayMeta) {
        try {
          meta = JSON.parse(params.overlayMeta as string);
        } catch {}
      }

      await createSnap({
        senderId: userId,
        recipientIds: selectedFriends,
        mediaUrl: publicUrl,
        type: params.mediaType as 'image' | 'video',
        overlayMeta: meta,
      });

      Alert.alert(
        'Sent!',
        `Snap sent to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to send snap:', error);
      Alert.alert('Error', 'Failed to send snap. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const renderFriend = ({ item }: { item: User }) => {
    const isSelected = selectedFriends.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => handleSelectFriend(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.friendInfo}>
          <Avatar source={item.avatar} size={48} />
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.displayName}</Text>
            <Text style={styles.friendUsername}>{item.username}</Text>
          </View>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color={colors.card} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.selectFriendsContainer}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.selectTitle}>Send To...</Text>
        <TouchableOpacity 
          onPress={handleSend} 
          style={[styles.sendButton, selectedFriends.length === 0 && styles.sendButtonDisabled]}
          disabled={isSending || selectedFriends.length === 0}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.card} />
          ) : (
            <>
              <Send size={20} color={colors.card} />
              <Text style={styles.sendButtonText}>Send</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Media Preview */}
      {params.mediaUri && (
        <View style={styles.previewContainer}>
          {params.mediaType === 'video' ? (
            <VideoPreview uri={params.mediaUri} />
          ) : (
            <Image source={{ uri: params.mediaUri }} style={styles.preview} resizeMode="cover" />
          )}
        </View>
      )}

      {/* Selected Friends Count */}
      {selectedFriends.length > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {/* Friends List */}
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.friendsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>Add friends to send snaps!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  selectFriendsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.card,
    fontWeight: '600',
  },
  previewContainer: {
    height: 120,
    backgroundColor: colors.darkGray,
  },
  preview: {
    flex: 1,
  },
  selectedCount: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.lightGray,
  },
  selectedCountText: {
    color: colors.text,
    fontWeight: '500',
  },
  friendsList: {
    paddingVertical: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    marginBottom: 1,
  },
  friendItemSelected: {
    backgroundColor: colors.lightGray,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendDetails: {
    gap: 2,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  friendUsername: {
    fontSize: 14,
    color: colors.darkGray,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.darkGray,
  },
});
