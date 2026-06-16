import { create } from 'zustand';
import { Tasting } from '../api/tea';
import { useTastingStore } from './useTastingStore';

interface ComparisonState {
  selectedTastingIds: string[];
  toggleTasting: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedTastings: () => Tasting[];
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  selectedTastingIds: [],

  toggleTasting: (id) => {
    set((state) => {
      const isSelected = state.selectedTastingIds.includes(id);
      if (isSelected) {
        return {
          selectedTastingIds: state.selectedTastingIds.filter((selectedId) => selectedId !== id),
        };
      } else {
        if (state.selectedTastingIds.length >= 4) {
          return state;
        }
        return {
          selectedTastingIds: [...state.selectedTastingIds, id],
        };
      }
    });
  },

  clearSelection: () => {
    set({ selectedTastingIds: [] });
  },

  isSelected: (id) => {
    return get().selectedTastingIds.includes(id);
  },

  getSelectedTastings: () => {
    const { selectedTastingIds } = get();
    const { tastings } = useTastingStore.getState();
    return selectedTastingIds
      .map((id) => tastings.find((t) => t.id === id))
      .filter((t): t is Tasting => t !== undefined);
  },
}));
