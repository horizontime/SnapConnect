import { create } from 'zustand';
import { supabase } from '@/utils/supabase';

export interface SnapRow {
  id: string;
  sender_id: string;
  media_url: string;
  type: 'image' | 'video';
  overlay_meta: any;
  created_at: string;
  sender: any;
}

type State = {
  snaps: SnapRow[];
  fetchSnaps: (userId: string) => Promise<void>;
  subscribeToSnaps: (userId: string) => void;
  markViewed: (id: string) => Promise<void>;
  deleteSnap: (id: string) => Promise<void>;
};

export const useSnapStore = create<State>((set, get) => ({
  snaps: [],

  fetchSnaps: async (userId: string) => {
    console.log('[SnapStore] Fetching snaps for user:', userId);
    
    // First try with join - using proper Supabase syntax
    const { data, error } = await supabase
      .from('snaps')
      .select(`
        id, 
        sender_id, 
        media_url, 
        type, 
        overlay_meta, 
        created_at,
        sender:profiles!sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .contains('recipient_ids', [userId]);

    if (error) {
      console.error('[SnapStore] Error fetching snaps with join:', error.message);
      console.error('[SnapStore] Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Fallback: Try fetching without join
      console.log('[SnapStore] Attempting fallback query without join...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('snaps')
        .select('*')
        .contains('recipient_ids', [userId]);
        
      if (fallbackError) {
        console.error('[SnapStore] Fallback query also failed:', fallbackError.message);
      } else if (fallbackData) {
        console.log('[SnapStore] Fallback query succeeded, found snaps:', fallbackData.length);
        
        // Manually fetch sender info for each snap
        const snapsWithSenders = await Promise.all(
          fallbackData.map(async (snap) => {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', snap.sender_id)
              .single();
              
            return {
              ...snap,
              sender: senderData ? {
                id: senderData.id,
                username: senderData.username,
                display_name: senderData.display_name,
                avatar: senderData.avatar_url
              } : null
            };
          })
        );
        
        console.log('[SnapStore] Snaps with sender info:', snapsWithSenders);
        set({ snaps: snapsWithSenders as SnapRow[] });
      }
    } else if (data) {
      console.log('[SnapStore] Fetched snaps:', data.length);
      console.log('[SnapStore] Snap data:', data);
      set({ snaps: data as SnapRow[] });
    }
  },

  subscribeToSnaps: (userId: string) => {
    console.log('[SnapStore] Setting up real-time subscription for user:', userId);

    // If we already have a subscription for this user, reuse it instead of creating a new one
    const existingChannel = (window as any).__snapChannel as any | undefined;
    if (existingChannel && existingChannel.topic === `realtime:public:snaps-${userId}`) {
      console.log('[SnapStore] Reusing existing snaps channel');
      return; // Already subscribed – no need to set up again
    }

    const channel = supabase.channel(`snaps-${userId}`);

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'snaps' },
      async payload => {
        console.log('[SnapStore] New snap received via real-time:', payload);
        const snap = payload.new as any;
        if (snap.recipient_ids.includes(userId)) {
          console.log('[SnapStore] Snap is for this user, fetching sender info...');
          // Fetch the sender information for the new snap
          const { data: snapWithSender, error } = await supabase
            .from('snaps')
            .select(`
              id, 
              sender_id, 
              media_url, 
              type, 
              overlay_meta, 
              created_at,
              sender:profiles!sender_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', snap.id)
            .single();

          if (!error && snapWithSender) {
            console.log('[SnapStore] Adding snap with sender info:', snapWithSender);
            set({ snaps: [snapWithSender, ...get().snaps] });
          } else if (error) {
            console.error('[SnapStore] Error fetching snap with sender:', error);
          }
        }
      },
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'snaps' },
      payload => {
        set({ snaps: get().snaps.filter(s => s.id !== payload.old.id) });
      },
    );

    channel.subscribe((status) => {
      console.log('[SnapStore] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[SnapStore] Successfully subscribed to snap updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[SnapStore] Error subscribing to snap updates');
      }
    });

    // Store the channel reference for cleanup if needed
    (window as any).__snapChannel = channel;
  },

  markViewed: async (id: string) => {
    set({ snaps: get().snaps.filter(s => s.id !== id) });
    await supabase.from('snaps').delete().eq('id', id);
  },

  deleteSnap: async (id: string) => {
    set({ snaps: get().snaps.filter(s => s.id !== id) });
    await supabase.from('snaps').delete().eq('id', id);
  },
})); 