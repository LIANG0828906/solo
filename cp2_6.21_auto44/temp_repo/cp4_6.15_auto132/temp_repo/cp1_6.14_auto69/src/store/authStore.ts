import { create } from 'zustand';
import type { User } from '../types';
import { toggleFavorite as apiToggleFavorite } from '../api/client';

const TOKEN_KEY = 'heritage_token';
const USER_KEY = 'heritage_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthModalOpen: boolean;

  login: (userData: User, token: string) => void;
  logout: () => void;
  checkAuth: () => void;
  toggleFavorite: (heritageId: string) => Promise<boolean>;
  setAuthModal: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthModalOpen: false,

  login: (userData: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    set({ user: userData, token });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        if (user && user.id) {
          set({ token, user });
          return;
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    set({ token: null, user: null });
  },

  toggleFavorite: async (heritageId: string): Promise<boolean> => {
    const { user, token } = get();
    if (!user || !token) {
      set({ isAuthModalOpen: true });
      return false;
    }

    try {
      const result = await apiToggleFavorite(heritageId);
      if (result.success) {
        const isFavorited = user.favorites.includes(heritageId);
        const newFavorites = isFavorited
          ? user.favorites.filter((id) => id !== heritageId)
          : [...user.favorites, heritageId];
        const updatedUser = { ...user, favorites: newFavorites };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        set({ user: updatedUser });
        return !isFavorited;
      }
      return false;
    } catch {
      return false;
    }
  },

  setAuthModal: (open: boolean) => {
    set({ isAuthModalOpen: open });
  },
}));
