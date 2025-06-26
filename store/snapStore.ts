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
    const { data, error } = await supabase
      .from('snaps')
      .select(`id, sender_id, media_url, type, overlay_meta, created_at, sender:sender_id(id, username, display_name, avatar)`)
      .contains('recipient_ids', [userId]);

    if (!error && data) {
      set({ snaps: data as SnapRow[] });
    }
  },

  subscribeToSnaps: (userId: string) => {
    const channel = supabase.channel(`snaps-${userId}`);

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'snaps' },
      payload => {
        const snap = payload.new as any;
        if (snap.recipient_ids.includes(userId)) {
          set({ snaps: [snap, ...get().snaps] });
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

    channel.subscribe();
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