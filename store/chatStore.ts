import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import { Chat, Message, User } from '@/types';
import { getSocket } from '@/utils/socket';
import {
  CHAT_SEND,
  CHAT_NEW,
  CHAT_READ,
  CHAT_TYPING,
  PRESENCE_UPDATE,
  ChatNewPayload,
  ChatReadPayload,
  PresenceUpdatePayload,
} from '@/shared/chatEvents';
import { useFriendStore } from '@/store/friendStore';

type ChatState = {
  chats: Chat[];
  messages: Record<string, Message[]>;
  typingIndicators: Record<string, boolean>;
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  getChatsWithUserData: () => (Chat & { user: User })[];
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, message: Omit<Message, 'id' | 'chatId' | 'timestamp' | 'isRead'>) => void;
  markChatAsRead: (chatId: string) => void;
  expireMessage: (chatId: string, messageId: string) => void;
  replayMessage: (chatId: string, messageId: string) => void;
  screenshotMessage: (chatId: string, messageId: string) => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: {},
  typingIndicators: {},
  currentChatId: null,
  
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
  
  getChatsWithUserData: () => get().chats as (Chat & { user: User })[],
  
  fetchChats: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        user1_id,
        user2_id,
        last_message_type,
        last_message_content,
        last_message_timestamp,
        last_message_is_read,
        unread_count
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_timestamp', { ascending: false });

    if (error) {
      console.error('[ChatStore] Failed to fetch chats:', error.message);
      return;
    }

    if (data) {
      const otherIds = Array.from(new Set(data.map((row: any) => (row.user1_id === userId ? row.user2_id : row.user1_id))));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds);

      // Fetch unread counts for all chats
      const chatIds = data.map((row: any) => row.id);
      const { data: messages } = await supabase
        .from('messages')
        .select('chat_id')
        .in('chat_id', chatIds)
        .neq('sender_id', userId)  // Only count received messages
        .eq('is_read', false);     // Only count unread messages

      // Group by chat_id and count
      const unreadCounts: Record<string, number> = {};
      if (messages) {
        messages.forEach((row: any) => {
          unreadCounts[row.chat_id] = (unreadCounts[row.chat_id] || 0) + 1;
        });
      }

      const chats = data.map((row: any): Chat & { user: User } => {
        const friendId = row.user1_id === userId ? row.user2_id : row.user1_id;

        // Raw profile row from Supabase
        const raw = (profiles || []).find((p: any) => p.id === friendId);

        // Convert DB column names to our camel-case User type
        const mappedUser: User = raw
          ? {
              id: raw.id,
              username: raw.username,
              displayName: raw.display_name || raw.username,
              avatar: raw.avatar_url,
              isOnline: raw.is_online ?? false,
            }
          : {
              id: friendId.toString(),
              username: '',
              displayName: '',
              avatar: '',
              isOnline: false,
            };

        // Use calculated unread count of received messages
        const actualUnreadCount = unreadCounts?.[row.id] || 0;

        return {
          id: row.id.toString(),
          userId: friendId.toString(),
          lastMessage: {
            type: row.last_message_type,
            content: row.last_message_type === 'text' ? row.last_message_content : 'Sent a Snap',
            timestamp: row.last_message_timestamp,
            isRead: row.last_message_is_read,
          },
          unreadCount: actualUnreadCount,
          user: mappedUser,
        };
      });

      set({ chats });
    }
  },

  fetchMessages: async (chatId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[ChatStore] Failed to fetch messages:', error.message);
      return;
    }

    if (data) {
      // Map database fields to our Message type
      const messages = data.map((row: any): Message => ({
        id: row.id.toString(),
        chatId: row.chat_id,
        senderId: row.sender_id.toString(),
        type: row.type,
        content: row.content,
        timestamp: row.timestamp,
        isRead: row.is_read || false,
        isExpired: row.is_expired || false,
        isReplayed: row.is_replayed || false,
        isScreenshotted: row.is_screenshotted || false,
      }));

      set(state => ({
        messages: { ...state.messages, [chatId]: messages },
      }));
    }
  },
  
  sendMessage: async (chatId, message) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Optimistically add to local state
    const optimisticMessage: Message = {
      id: tempId,
      chatId,
      senderId: userId.toString(),
      type: message.type,
      content: message.content,
      timestamp,
      isRead: false,
    };

    set(state => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), optimisticMessage],
      },
    }));

    try {
      const socket = await getSocket();
      socket.emit(CHAT_SEND, {
        chatId,
        type: message.type,
        content: message.content,
        clientTempId: tempId,
      });
    } catch (err: any) {
      console.error('[ChatStore] socket emit failed', err.message);
    }
  },
  
  markChatAsRead: (chatId) => {
    // Emit read receipt to server
    getSocket()
      .then(socket => {
        const lastMsg = (get().messages[chatId] || []).slice(-1)[0];
        if (lastMsg) {
          socket.emit(CHAT_READ, { chatId, messageId: lastMsg.id });
        }
      })
      .catch(() => {});

    return set(state => {
      const updatedChats = state.chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              isRead: true,
            },
            unreadCount: 0,
          };
        }
        return chat;
      });
      
      const updatedMessages = { 
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map(message => ({
          ...message,
          isRead: true,
        }))
      };
      
      return { chats: updatedChats, messages: updatedMessages };
    });
  },
  
  expireMessage: (chatId, messageId) => set(state => {
    const updatedMessages = { 
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map(message => {
        if (message.id === messageId) {
          return { ...message, isExpired: true };
        }
        return message;
      })
    };
    
    return { messages: updatedMessages };
  }),
  
  replayMessage: (chatId, messageId) => set(state => {
    const updatedMessages = { 
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map(message => {
        if (message.id === messageId) {
          return { ...message, isReplayed: true };
        }
        return message;
      })
    };
    
    return { messages: updatedMessages };
  }),
  
  screenshotMessage: (chatId, messageId) => set(state => {
    const updatedMessages = { 
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map(message => {
        if (message.id === messageId) {
          return { ...message, isScreenshotted: true };
        }
        return message;
      })
    };
    
    return { messages: updatedMessages };
  }),
}));

// ---------------------------------------------
// Socket.IO listeners – register once at module load
// ---------------------------------------------
(async () => {
  try {
    const socket = await getSocket();

    // Handle new messages from server
    socket.on(CHAT_NEW, (msg: ChatNewPayload) => {
      useChatStore.setState(state => {
        const existing = state.messages[msg.chatId] || [];
        const newMsg = { ...msg, senderId: msg.senderId.toString() };
        const withoutTemp = existing.filter(m => !m.id.startsWith('temp-'));
        return {
          messages: {
            ...state.messages,
            [msg.chatId]: [...withoutTemp, newMsg],
          },
        };
      });
    });

    // Handle read receipts
    socket.on(CHAT_READ, ({ chatId, messageId }: ChatReadPayload) => {
      useChatStore.setState(state => {
        const updatedMsgs = (state.messages[chatId] || []).map(m => m.id === messageId ? { ...m, isRead: true } : m);
        return { messages: { ...state.messages, [chatId]: updatedMsgs } };
      });
    });

    // Handle typing indicator
    socket.on(CHAT_TYPING, ({ chatId, isTyping }) => {
      useChatStore.setState(state => ({
        typingIndicators: { ...state.typingIndicators, [chatId]: isTyping },
      }));
    });

    socket.on(PRESENCE_UPDATE, ({ userId, isOnline }: PresenceUpdatePayload) => {
      useFriendStore.getState().setOnlineStatus(userId, isOnline);
    });
  } catch (err: any) {
    console.error('[ChatStore] Failed to initialize socket listeners', err?.message);
  }
})();