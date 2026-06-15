/**
 * 【文件职责】使用 zustand 管理全局用户会话状态，包含登录信息、用户数据、登录/登出/初始化方法
 * 【被调用方】App.tsx（初始化 session）、NavBar.tsx（显示用户信息、登出）、AuthPage.tsx（登录注册后设置用户）、路由守卫
 * 【数据流向】页面触发 action → store 更新状态 → 订阅组件重新渲染获取最新 user/isLoading
 */
import { create } from 'zustand';
import api, { User } from '@/utils/api';

interface SessionState {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  fetchSession: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isLoading: true,
  initialized: false,

  fetchSession: async () => {
    set({ isLoading: true });
    try {
      const res = await api.getSession();
      if (res.success && res.data) {
        set({ user: res.data });
      }
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },

  setUser: (user) => {
    set({ user });
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      set({ user: null });
    }
  },
}));

export default useSessionStore;
