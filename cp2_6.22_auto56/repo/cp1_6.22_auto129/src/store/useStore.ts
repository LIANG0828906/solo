import { create } from 'zustand';
import { User } from '../types';

interface AppState {
  currentUser: User | null;
  loading: boolean;
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useStore = create<AppState>((set) => ({
  currentUser: getStoredUser(),
  loading: false,
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    set({ currentUser: user });
  },
  setLoading: (loading) => set({ loading }),
  logout: () => {
    localStorage.removeItem('currentUser');
    set({ currentUser: null });
  },
}));
