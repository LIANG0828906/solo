import { create } from 'zustand';
import type { User, PreferenceRecord } from '@/types';

interface AppState {
  currentUser: User | null;
  users: User[];
  preferences: PreferenceRecord[];
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  setPreferences: (prefs: PreferenceRecord[]) => void;
  addOrUpdatePreference: (record: PreferenceRecord) => void;
  logout: () => void;
}

const loadUserFromStorage = (): User | null => {
  try {
    const raw = localStorage.getItem('office-current-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAppStore = create<AppState>((set) => ({
  currentUser: loadUserFromStorage(),
  users: [],
  preferences: [],

  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('office-current-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('office-current-user');
    }
    set({ currentUser: user });
  },

  setUsers: (users) => set({ users }),
  setPreferences: (preferences) => set({ preferences }),

  addOrUpdatePreference: (record) =>
    set((state) => {
      const idx = state.preferences.findIndex((r) => r.userId === record.userId);
      const next = [...state.preferences];
      if (idx >= 0) next[idx] = record;
      else next.push(record);
      return { preferences: next };
    }),

  logout: () => {
    localStorage.removeItem('office-current-user');
    set({ currentUser: null });
  },
}));
