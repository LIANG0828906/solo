import { create } from 'zustand';
import type { Exploration, ExplorationType, User } from '@/types';
import { getCurrentUser } from '@/lib/utils';

interface AppState {
  user: User;
  explorations: Exploration[];
  selectedExploration: Exploration | null;
  typeFilter: ExplorationType | null;
  setUser: (u: User) => void;
  setExplorations: (list: Exploration[]) => void;
  addExploration: (e: Exploration) => void;
  updateExploration: (e: Exploration) => void;
  removeExploration: (id: string) => void;
  setSelectedExploration: (e: Exploration | null) => void;
  setTypeFilter: (t: ExplorationType | null) => void;
  incrementVisit: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: getCurrentUser(),
  explorations: [],
  selectedExploration: null,
  typeFilter: null,
  setUser: (u) => {
    localStorage.setItem('city-explorer-user', JSON.stringify(u));
    set({ user: u });
  },
  setExplorations: (list) => set({ explorations: list }),
  addExploration: (e) => set({ explorations: [e, ...get().explorations] }),
  updateExploration: (e) =>
    set({
      explorations: get().explorations.map((x) => (x.id === e.id ? e : x)),
    }),
  removeExploration: (id) =>
    set({
      explorations: get().explorations.filter((x) => x.id !== id),
      selectedExploration: get().selectedExploration?.id === id ? null : get().selectedExploration,
    }),
  setSelectedExploration: (e) => set({ selectedExploration: e }),
  setTypeFilter: (t) => set({ typeFilter: t }),
  incrementVisit: (id) =>
    set({
      explorations: get().explorations.map((x) =>
        x.id === id ? { ...x, visitCount: x.visitCount + 1 } : x
      ),
    }),
}));
