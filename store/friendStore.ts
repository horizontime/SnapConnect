import { create } from 'zustand';
import { mockUsers } from '@/constants/mockData';
import { User } from '@/types';

type FriendState = {
  friends: User[];
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;
  getFriendById: (friendId: string) => User | undefined;
  searchFriends: (query: string) => User[];
};

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: mockUsers,
  
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
}));