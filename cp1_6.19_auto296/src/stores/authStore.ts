import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import api from '../utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (username: string, password: string) => {
        const response = await api.post<{ user: User; token: string }>('/auth/login', {
          username,
          password,
        });
        set({
          user: response.data.user,
          token: response.data.token,
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      isAuthenticated: () => {
        return !!get().token;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
