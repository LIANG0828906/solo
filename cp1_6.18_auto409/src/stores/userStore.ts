import { create } from 'zustand';
import type { MemberDetail } from '../types';

interface UserState {
  userDetail: MemberDetail | null;
  loading: boolean;
  error: string | null;
  fetchUserDetail: (id: number) => Promise<void>;
  clearUserDetail: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userDetail: null,
  loading: false,
  error: null,

  fetchUserDetail: async (id: number) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/members/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: MemberDetail = await response.json();
      set({ userDetail: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取用户详情失败';
      set({ loading: false, error: message });
    }
  },

  clearUserDetail: () => {
    set({ userDetail: null, loading: false, error: null });
  },
}));
