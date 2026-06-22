import { create } from 'zustand';
import type { User, Match } from '../types';

interface AppState {
  currentUser: User | null;
  matches: Match[];
  matchedUser: User | null;
  showMatchModal: boolean;
  sidebarOpen: boolean;
  setCurrentUser: (user: User | null) => void;
  setMatches: (matches: Match[]) => void;
  setMatchedUser: (user: User | null) => void;
  setShowMatchModal: (show: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  updateCurrentUser: (data: Partial<User>) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  matches: [],
  matchedUser: null,
  showMatchModal: false,
  sidebarOpen: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setMatches: (matches) => set({ matches }),
  setMatchedUser: (user) => set({ matchedUser: user }),
  setShowMatchModal: (show) => set({ showMatchModal: show }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  updateCurrentUser: (data) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...data } : null,
    })),
}));
