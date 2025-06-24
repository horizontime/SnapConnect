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
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { User, MessageType } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, Send, Check } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

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
  const params = useLocalSearchParams<{ screen?: string; mediaUri?: string; mediaType?: string }>();
  
  // If not showing friend selection, show default modal
  if (params.screen !== 'selectFriends') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <View style={styles.separator} />
        <Text>This is an example modal. You can edit it in app/modal.tsx.</Text>
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      </View>
    );
  }

  return <SelectFriendsScreen />;
}

function SelectFriendsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mediaUri?: string; mediaType?: string }>();
  const { friends, fetchFriends } = useFriendStore();
  const { sendMessage, chats } = useChatStore();
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

    if (!params.mediaUri || !params.mediaType) {
      Alert.alert('Error', 'No media to send');
      return;
    }

    setIsSending(true);

    try {
      // In a real app, we would upload the media to storage and get a URL
      // For now, we'll just send the local URI
      const messageType: MessageType = params.mediaType === 'video' ? 'video' : 'image';
      
      // Send to each selected friend
      for (const friendId of selectedFriends) {
        // Find existing chat with this friend or use a temporary ID
        const existingChat = chats.find(chat => chat.userId === friendId);
        const chatId = existingChat?.id || `temp_chat_${friendId}`;
        
        await sendMessage(chatId, {
          type: messageType,
          content: params.mediaUri,
          senderId: userId || '', // From auth store
        });
      }

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
            <Text style={styles.friendUsername}>@{item.username}</Text>
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
