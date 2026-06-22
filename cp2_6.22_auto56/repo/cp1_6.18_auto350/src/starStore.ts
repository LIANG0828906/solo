import { create } from 'zustand';
import type { StarData, Constellation, Era } from './types';
import { loadAllStarData } from './dataLoader';

interface StarStore {
  stars: StarData[];
  constellations: Constellation[];
  eras: Era[];
  currentEraIndex: number;
  targetEraIndex: number;
  transitionProgress: number;
  isPlaying: boolean;
  selectedStarId: string | null;
  setEra: (index: number) => void;
  setTransitionProgress: (p: number) => void;
  togglePlay: () => void;
  selectStar: (id: string | null) => void;
  advanceEra: () => void;
  initializeData: () => void;
}

export const useStarStore = create<StarStore>((set, get) => ({
  stars: [],
  constellations: [],
  eras: [],
  currentEraIndex: 0,
  targetEraIndex: 0,
  transitionProgress: 1,
  isPlaying: false,
  selectedStarId: null,

  initializeData: () => {
    const { stars, constellations, eras } = loadAllStarData();
    set({ stars, constellations, eras });
  },

  setEra: (index: number) => {
    const { currentEraIndex, targetEraIndex, transitionProgress } = get();
    const clampedIndex = Math.max(0, Math.min(2, index));

    if (transitionProgress < 1) {
      set({
        targetEraIndex: clampedIndex,
        transitionProgress: 0,
      });
    } else if (clampedIndex !== currentEraIndex) {
      set({
        currentEraIndex,
        targetEraIndex: clampedIndex,
        transitionProgress: 0,
      });
    }
  },

  setTransitionProgress: (p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    if (clamped >= 1) {
      const { targetEraIndex } = get();
      set({
        currentEraIndex: targetEraIndex,
        transitionProgress: 1,
      });
    } else {
      set({ transitionProgress: clamped });
    }
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  selectStar: (id: string | null) => {
    set({ selectedStarId: id });
  },

  advanceEra: () => {
    const { currentEraIndex, targetEraIndex, transitionProgress } = get();
    if (transitionProgress < 1) return;

    const baseIndex = targetEraIndex;
    const nextIndex = (baseIndex + 1) % 3;

    set({
      currentEraIndex: baseIndex,
      targetEraIndex: nextIndex,
      transitionProgress: 0,
    });
  },
}));
