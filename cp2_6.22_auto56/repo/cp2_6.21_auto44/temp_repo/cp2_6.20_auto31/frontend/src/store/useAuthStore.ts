import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister, refreshToken as apiRefreshToken } from '../services/api';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshTokenFn: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  ensureDemoUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      ensureDemoUser: async () => {
        if (get().isAuthenticated) return;
        try {
          const demoEmail = `demo_${Date.now()}@vinylhub.com`;
          const demoUsername = `vinylfan_${Math.floor(Math.random() * 10000)}`;
          const result = await apiRegister({
            username: demoUsername,
            email: demoEmail,
            password: 'password123',
            bio: '热爱黑胶唱片的音乐爱好者 🎵',
          });
          const { access_token, refresh_token, user } = result;
          set({
            token: access_token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem('refresh_token', refresh_token);
        } catch (e) {
          console.warn('Demo user creation failed', e);
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await apiLogin({ email, password });
          const { access_token, refresh_token, user } = result;
          set({
            token: access_token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem('refresh_token', refresh_token);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true });
        try {
          const result = await apiRegister(data);
          const { access_token, refresh_token, user } = result;
          set({
            token: access_token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem('refresh_token', refresh_token);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        localStorage.removeItem('refresh_token');
        window.location.href = '/collection';
      },

      refreshTokenFn: async () => {
        try {
          const result = await apiRefreshToken();
          const token = result.access_token || result.token;
          if (token) {
            set({ token, isAuthenticated: true });
          }
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
