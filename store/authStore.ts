import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = {
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  login: (userId: string, username: string, displayName: string, avatar: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      username: null,
      displayName: null,
      avatar: null,
      login: (userId, username, displayName, avatar) => 
        set({ isAuthenticated: true, userId, username, displayName, avatar }),
      logout: () => 
        set({ isAuthenticated: false, userId: null, username: null, displayName: null, avatar: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);