import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  CHAT_SEND,
  CHAT_NEW,
  CHAT_READ,
  CHAT_TYPING,
  SYSTEM_ERROR,
} from '../shared/chatEvents.ts';

config();

const PORT = process.env.PORT || 3333;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// Supabase service role client (used only on the backend)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Exiting.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Presence map: chatId -> Set<userId>
const presence = new Map();

// Helper to get chat IDs for a user
async function getUserChatIds(userId) {
  const { data, error } = await supabase
    .from('chats')
    .select('id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error) {
    console.error('[getUserChatIds]', error.message);
    return [];
  }
  return (data || []).map((row) => row.id.toString());
}

// Auth middleware – verifies the JWT with Supabase and attaches userId
io.use(async (socket, next) => {
  const token = socket.handshake.query.token;
  if (!token || typeof token !== 'string') {
    return next(new Error('Auth: missing token'));
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new Error('Auth: invalid token'));
    }

    socket.data.userId = user.id;
    return next();
  } catch (err) {
    return next(new Error('Auth: verification failed'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  console.log('Socket connected:', socket.id, 'user:', userId);

  // Join all chat rooms the user participates in
  const chatIds = await getUserChatIds(userId);
  chatIds.forEach((chatId) => {
    socket.join(chatId);

    if (!presence.has(chatId)) presence.set(chatId, new Set());
    presence.get(chatId).add(userId);

    // Notify others in the room that this user is online
    socket.to(chatId).emit('presence:update', { userId, isOnline: true });
  });

  socket.emit('system:hello', { message: 'Connected to Socket.IO server!' });

  // -----------------------
  // chat:send – client sends a new message
  // -----------------------
  socket.on(CHAT_SEND, async (payload) => {
    const { chatId, type, content } = payload;

    // Basic validation: ensure socket is in this room
    if (!socket.rooms.has(chatId)) {
      return socket.emit(SYSTEM_ERROR, { message: 'Not a participant of this chat.' });
    }

    try {
      const timestamp = new Date().toISOString();
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userId,
          type,
          content,
          timestamp,
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage = {
        id: data.id.toString(),
        chatId,
        senderId: userId,
        type: data.type,
        content: data.content,
        timestamp: data.timestamp,
        isRead: false,
      };

      // Broadcast to everyone in the room
      io.to(chatId).emit(CHAT_NEW, newMessage);
    } catch (err) {
      console.error('[chat:send]', err.message);
      socket.emit(SYSTEM_ERROR, { message: 'Failed to send message.' });
    }
  });

  // -----------------------
  // chat:read – client read receipt
  // -----------------------
  socket.on(CHAT_READ, async ({ chatId, messageId }) => {
    if (!socket.rooms.has(chatId)) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      // Broadcast to everyone else in the room
      socket.to(chatId).emit(CHAT_READ, { chatId, messageId });
    } catch (err) {
      console.error('[chat:read]', err.message);
      socket.emit(SYSTEM_ERROR, { message: 'Failed to mark as read.' });
    }
  });

  // -----------------------
  // chat:typing – relay typing indicator
  // -----------------------
  socket.on(CHAT_TYPING, ({ chatId, isTyping }) => {
    if (!socket.rooms.has(chatId)) return;
    socket.to(chatId).emit(CHAT_TYPING, { chatId, isTyping });
  });

  // Cleanup on disconnect
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', socket.id, reason);
    // Remove user from presence map
    for (const room of socket.rooms) {
      if (presence.has(room)) {
        presence.get(room).delete(userId);
        if (presence.get(room).size === 0) {
          presence.delete(room);
          // broadcast offline status
          socket.to(room).emit('presence:update', { userId, isOnline: false });
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
}); 