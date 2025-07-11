import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useChatStore } from '@/store/chatStore';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { Avatar } from '@/components/ui/Avatar';
import { formatTimestamp } from '@/utils/timeUtils';
import { Send, Check, Clock, CheckCheck } from 'lucide-react-native';
import { Message } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSocket } from '@/utils/socket';
import { CHAT_TYPING } from '@/shared/chatEvents';

export default function ChatScreen() {
  const { id, userId } = useLocalSearchParams<{ id: string; userId: string }>();
  const { messages, typingIndicators, sendMessage, markChatAsRead, currentChatId, setCurrentChatId, fetchMessages } = useChatStore();
  const { getFriendById } = useFriendStore();
  const { userId: authUserId } = useAuthStore();
  
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  
  // Amount to translate view when keyboard is shown
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 90 : 40;
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const friend = getFriendById(userId);
  const chatMessages = messages[id] || [];
  
  useEffect(() => {
    if (id) {
      setCurrentChatId(id);
      markChatAsRead(id);
      fetchMessages(id);
    }
    
    return () => {
      setCurrentChatId(null);
    };
  }, [id]);
  
  useEffect(() => {
    if (chatMessages.length === 0) return;

    const hasUnreadFromOther = chatMessages.some(
      (m) => String(m.senderId) !== String(authUserId) && !m.isRead
    );

    if (hasUnreadFromOther) {
      markChatAsRead(id);
    }
  }, [chatMessages, authUserId]);
  
  const emitTyping = async (isTyping: boolean) => {
    try {
      const socket = await getSocket();
      socket.emit(CHAT_TYPING, { chatId: id, isTyping });
    } catch {}
  };

  const onChangeText = (val: string) => {
    setText(val);

    emitTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1500);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    
    sendMessage(id, {
      senderId: authUserId!,
      type: 'text',
      content: text,
    });
    
    setText('');
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = String(item.senderId) === String(authUserId);
    
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {item.type === 'text' ? (
          <View style={[styles.textBubble, isMe ? styles.myBubble : styles.theirBubble]}>
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          </View>
        ) : (
          <View style={[styles.mediaBubble, isMe ? styles.myBubble : styles.theirBubble]}>
            {item.isExpired ? (
              <Text style={styles.expiredText}>Snap expired</Text>
            ) : (
              <View style={styles.mediaContent}>
                <Text style={styles.mediaText}>
                  {item.type === 'image' ? '📷 Photo' : '🎥 Video'}
                </Text>
                <Text style={styles.tapToView}>Tap to view</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
            {formatTimestamp(item.timestamp)}
          </Text>
          {isMe && (
            <View style={{ marginLeft: 4 }}>
              {item.id.startsWith('temp-') ? (
                <Clock size={12} color={colors.textLight} />
              ) : item.isRead ? (
                <CheckCheck size={12} color={colors.primary} />
              ) : (
                <Check size={12} color={colors.textLight} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <>
      {friend && (
        <Stack.Screen
          options={{
            title: friend.displayName,
            headerRight: () => (
              <Avatar
                source={friend.avatar}
                size={32}
                showOnlineBadge
                isOnline={friend.isOnline}
                style={{ marginRight: 16 }}
              />
            ),
          }}
        />
      )}
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          extraData={authUserId}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => {
            if (chatMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
            </View>
          )}
        />
        
        {typingIndicators[id] && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            <Text style={{ color: colors.textLight, fontStyle: 'italic' }}>
              {friend?.displayName || 'Friend'} is typing...
            </Text>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}> 
          {/* Camera button removed to make chat input text-only */}
          
          <TextInput 
            style={styles.input} 
            placeholder="Message" 
            value={text} 
            onChangeText={onChangeText} 
            multiline 
          /> 
          
          <TouchableOpacity  
            style={[styles.sendButton, !text.trim() && styles.disabledSendButton]}  
            onPress={handleSend} 
            disabled={!text.trim()} 
          > 
            <Send size={20} color={text.trim() ? colors.card : colors.inactive} /> 
          </TouchableOpacity> 
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  textBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mediaBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  myBubble: {
    backgroundColor: colors.primary,
  },
  theirBubble: {
    backgroundColor: colors.card,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: colors.card,
  },
  theirMessageText: {
    color: colors.text,
  },
  mediaContent: {
    alignItems: 'center',
  },
  mediaText: {
    fontSize: 16,
    color: colors.card,
    marginBottom: 4,
  },
  tapToView: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  expiredText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  myTimestamp: {
    color: colors.textLight,
    textAlign: 'right',
  },
  theirTimestamp: {
    color: colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: colors.border,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});