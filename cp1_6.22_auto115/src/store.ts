import { create } from 'zustand';
import type { User } from './types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const STORAGE_KEY = 'recipe_user';

function loadUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    return null;
  }
  return null;
}

export const useAppStore = create<AppState>((set) => ({
  user: loadUser(),
  setUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null });
  },
}));
