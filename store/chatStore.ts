import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import { Chat, Message, User } from '@/types';

type ChatState = {
  chats: Chat[];
  messages: Record<string, Message[]>;
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

        return {
          id: row.id.toString(),
          userId: friendId.toString(),
          lastMessage: {
            type: row.last_message_type,
            content: row.last_message_type === 'text' ? row.last_message_content : 'Sent a Snap',
            timestamp: row.last_message_timestamp,
            isRead: row.last_message_is_read,
          },
          unreadCount: row.unread_count,
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
      set(state => ({
        messages: { ...state.messages, [chatId]: data as Message[] },
      }));
    }
  },
  
  sendMessage: async (chatId, message) => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const timestamp = new Date().toISOString();

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: userId, type: message.type, content: message.content, timestamp }])
      .select()
      .single();

    if (error) {
      console.error('[ChatStore] Failed to send message:', error.message);
      return;
    }

    const newMessage: Message = {
      id: inserted.id.toString(),
      chatId,
      senderId: userId,
      type: inserted.type,
      content: inserted.content,
      timestamp: inserted.timestamp,
      isRead: false,
    };

    set(state => {
      const updatedChats = state.chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: {
              type: newMessage.type,
              content: newMessage.type === 'text' ? newMessage.content : 'Sent a Snap',
              timestamp: newMessage.timestamp,
              isRead: false,
            },
            unreadCount: chat.unreadCount, // current user's sent msg shouldn't increase own unread
          } as Chat & { user: User };
        }
        return chat;
      });

      return {
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), newMessage],
        },
        chats: updatedChats,
      };
    });
  },
  
  markChatAsRead: (chatId) => set(state => {
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
  }),
  
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