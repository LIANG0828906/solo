import { create } from 'zustand';
import { User } from './types';

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const STORAGE_KEY = 'skill_swap_user';

function loadSavedUser(): User | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: loadSavedUser(),
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ currentUser: user });
  },
}));
