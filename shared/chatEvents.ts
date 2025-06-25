/**
 * Shared Socket.IO event contract between the Expo client and the Node server.
 *
 * IMPORTANT: Keep this file as the single source of truth for all real-time
 * chat-related events so the payloads remain type-safe across both codebases.
 */

// ---------------------------------------------
// Event names
// ---------------------------------------------

export const CHAT_SEND = 'chat:send' as const;
export const CHAT_NEW = 'chat:new' as const;
export const CHAT_READ = 'chat:read' as const;
export const CHAT_TYPING = 'chat:typing' as const;
export const SYSTEM_ERROR = 'system:error' as const;

// A union of all event string literals
export type SocketEvent =
  | typeof CHAT_SEND
  | typeof CHAT_NEW
  | typeof CHAT_READ
  | typeof CHAT_TYPING
  | typeof SYSTEM_ERROR;

// ---------------------------------------------
// Payload types
// ---------------------------------------------

// What the client sends when posting a new message
export interface ChatSendPayload {
  chatId: string;
  type: 'text' | 'image' | 'video';
  content: string; // plain text or URL (for image/video)
  clientTempId: string; // a temporary ID so the client can reconcile optimistic UI
}

// What the server broadcasts when a message has been saved
export interface ChatNewPayload {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'video';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatReadPayload {
  chatId: string;
  messageId: string;
}

export interface ChatTypingPayload {
  chatId: string;
  isTyping: boolean;
}

export interface SystemErrorPayload {
  message: string;
}

// ---------------------------------------------
// Event map helper (useful for typed Socket.IO wrappers)
// ---------------------------------------------

export interface ChatEventMap {
  [CHAT_SEND]: (payload: ChatSendPayload) => void;
  [CHAT_NEW]: (payload: ChatNewPayload) => void;
  [CHAT_READ]: (payload: ChatReadPayload) => void;
  [CHAT_TYPING]: (payload: ChatTypingPayload) => void;
  [SYSTEM_ERROR]: (payload: SystemErrorPayload) => void;
} 