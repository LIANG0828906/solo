import { create } from 'zustand';
import { User } from '../types';
import { userApi } from '../api/userApi';

interface UserState {
  user: User | null;
  isLoading: boolean;
  fetchCurrentUser: () => Promise<void>;
  login: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const user = await userApi.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  login: async () => {
    set({ isLoading: true });
    try {
      const user = await userApi.login();
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));
