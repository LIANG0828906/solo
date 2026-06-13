/**
 * 【组件职责】全局用户会话状态管理，提供登录用户信息的存取、登出清除、以及初始化时的会话拉取
 * 【被调用方】App.tsx（应用启动时 fetchSession）、NavBar（展示用户信息/登出）、各需鉴权的业务组件
 * 【数据流向】后端 session 接口 → fetchSession() → setUser() → store state → 组件通过 useSessionStore 订阅渲染
 */
import { create } from 'zustand';
import { getSession, logout as apiLogout, User } from '@/utils/api';

interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  clearUser: () => void;
  fetchSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user, error: null }),

  clearUser: () => set({ user: null, error: null }),

  fetchSession: async () => {
    set({ loading: true, error: null });
    try {
      const user = await getSession();
      set({ user, loading: false });
    } catch (err) {
      const apiError = err as { message?: string };
      set({
        user: null,
        loading: false,
        error: apiError?.message || '获取会话失败',
      });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await apiLogout();
    } finally {
      set({ user: null, loading: false, error: null });
    }
  },
}));
