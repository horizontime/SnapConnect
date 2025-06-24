import { create } from 'zustand';
import { User } from '@/types';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';

type FriendState = {
  friends: User[];
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;
  getFriendById: (friendId: string) => User | undefined;
  searchFriends: (query: string) => User[];
  fetchFriends: () => Promise<void>;
};

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  
  addFriend: (friend) => set(state => ({
    friends: [...state.friends, friend]
  })),
  
  removeFriend: (friendId) => set(state => ({
    friends: state.friends.filter(friend => friend.id !== friendId)
  })),
  
  getFriendById: (friendId) => {
    return get().friends.find(friend => friend.id === friendId);
  },
  
  searchFriends: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().friends.filter(
      friend => 
        friend.username.toLowerCase().includes(lowerQuery) || 
        friend.displayName.toLowerCase().includes(lowerQuery)
    );
  },
  
  fetchFriends: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data: rows, error } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) throw error;

      const friendIds = (rows || []).map((r: any) => (r.user_id === userId ? r.friend_id : r.user_id));

      if (friendIds.length === 0) {
        set({ friends: [] });
        return;
      }

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', friendIds);

      if (pErr) throw pErr;

      const mapped: User[] = (profiles || []).map((p: any) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name || p.username,
        avatar: p.avatar_url,
        isOnline: false,
      }));

      set({ friends: mapped });
    } catch (err: any) {
      console.error('[FriendStore] fetchFriends', err.message);
    }
  },
}));