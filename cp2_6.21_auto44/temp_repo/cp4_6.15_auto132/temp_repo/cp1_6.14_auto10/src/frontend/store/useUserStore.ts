import { create } from 'zustand';
import { User, getCurrentUser } from '../utils/apiClient';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const user = await getCurrentUser();
      set({ user, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取用户信息失败', loading: false });
    }
  },
  setUser: (user) => set({ user }),
}));
