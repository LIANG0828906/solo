import { create } from 'zustand';
import type { User } from '@/api';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'gallery_auth';

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    set({ user, token, isAuthenticated: true });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, token })
      );
    } catch {
      // ignore
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  hydrate: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { user: User; token: string };
        if (parsed.user && parsed.token) {
          set({
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: true,
          });
        }
      }
    } catch {
      // ignore
    }
  },
}));
