export type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
};

export type MessageType = 'text' | 'image' | 'video';

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  timestamp: string;
  duration?: number;
  isExpired?: boolean;
  isRead: boolean;
  isReplayed?: boolean;
  isScreenshotted?: boolean;
};

export type LastMessage = {
  type: MessageType;
  content: string;
  timestamp: string;
  isRead: boolean;
};

export type Chat = {
  id: string;
  userId: string;
  lastMessage: LastMessage;
  unreadCount: number;
};

export type StoryItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  timestamp: string;
  caption?: string;
  duration?: number;
};

export type Story = {
  id: string;
  userId: string;
  items: StoryItem[];
  lastUpdated: string;
  viewed: boolean;
};

export type Filter = {
  id: string;
  name: string;
  description: string;
  icon: string;
};