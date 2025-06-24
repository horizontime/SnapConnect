import { create } from 'zustand';
import { mockChats, mockUsers } from '@/constants/mockData';
import { Chat, Message, User } from '@/types';

type ChatState = {
  chats: Chat[];
  messages: Record<string, Message[]>;
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  getChatsWithUserData: () => (Chat & { user: User })[];
  sendMessage: (chatId: string, message: Omit<Message, 'id' | 'chatId' | 'timestamp' | 'isRead'>) => void;
  markChatAsRead: (chatId: string) => void;
  expireMessage: (chatId: string, messageId: string) => void;
  replayMessage: (chatId: string, messageId: string) => void;
  screenshotMessage: (chatId: string, messageId: string) => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: mockChats,
  messages: mockChats.reduce((acc, chat) => {
    acc[chat.id] = [];
    return acc;
  }, {} as Record<string, Message[]>),
  currentChatId: null,
  
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
  
  getChatsWithUserData: () => {
    const { chats } = get();
    return chats.map(chat => {
      const user = mockUsers.find(user => user.id === chat.userId);
      return { ...chat, user: user! };
    });
  },
  
  sendMessage: (chatId, message) => set(state => {
    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...message,
    };
    
    const updatedMessages = { 
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), newMessage]
    };
    
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
          unreadCount: chat.unreadCount + 1,
        };
      }
      return chat;
    });
    
    return { messages: updatedMessages, chats: updatedChats };
  }),
  
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