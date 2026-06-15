import { create } from 'zustand';
import type { AppState } from '@/types';

export const useStore = create<AppState>((set) => ({
  timeMonth: 0,
  showConstellationLines: true,
  selectedStarId: null,
  searchQuery: '',
  setTimeMonth: (month) => set({ timeMonth: month }),
  toggleConstellationLines: () =>
    set((state) => ({ showConstellationLines: !state.showConstellationLines })),
  setSelectedStarId: (id) => set({ selectedStarId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
