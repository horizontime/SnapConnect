import { io, Socket } from 'socket.io-client';
import { SOCKET_IO_ENDPOINT } from '@/constants/socket';
import { supabase } from '@/utils/supabase';
import type { ChatEventMap } from '@/shared/chatEvents';

let socket: Socket<ChatEventMap, ChatEventMap> | null = null;

async function createSocket() {
  // Get current access token from Supabase session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  // If no token, we can't connect yet
  if (!token) {
    throw new Error('No Supabase session token found – user must be logged in');
  }

  console.log('[Socket] endpoint', SOCKET_IO_ENDPOINT);

  // Use io() to create socket instance with reconnect options
  socket = io(SOCKET_IO_ENDPOINT, {
    query: { token },
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  // Start connection after initial setup
  socket.connect();

  // Log connection issues (optional)
  socket.on('connect_error', (err: Error) => console.warn('[Socket] connect_error', err.message));
  (socket as any).on('reconnect_attempt', (attempt: number) => console.log('[Socket] reconnect_attempt', attempt));
  (socket as any).on('reconnect_failed', () => console.warn('[Socket] reconnect_failed'));

  return socket;
}

export async function getSocket() {
  if (!socket) {
    socket = await createSocket();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and cleaned up');
  }
} 