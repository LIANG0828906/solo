import { create } from 'zustand';
import type { Star, EvolutionPoint, SpectralType } from '../types/star';
import { starCatalog } from '../data/StarCatalog';

interface StarStoreState {
  stars: Star[];
  selectedStarId: string | null;
  filterType: SpectralType;
  isPlaying: boolean;
  evolutionProgress: number;
  evolutionPath: EvolutionPoint[];
  setStars: (stars: Star[]) => void;
  setSelectedStar: (id: string | null) => void;
  setFilterType: (type: SpectralType) => void;
  togglePlayback: () => void;
  setEvolutionProgress: (progress: number) => void;
  loadEvolutionPath: (starId: string) => void;
}

export const useStarStore = create<StarStoreState>((set) => ({
  stars: [],
  selectedStarId: null,
  filterType: 'ALL',
  isPlaying: false,
  evolutionProgress: 0,
  evolutionPath: [],

  setStars: (stars: Star[]) => set({ stars }),

  setSelectedStar: (id: string | null) => set({
    selectedStarId: id,
    evolutionProgress: 0,
    isPlaying: false
  }),

  setFilterType: (type: SpectralType) => set({ filterType: type }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setEvolutionProgress: (progress: number) => set({ evolutionProgress: progress }),

  loadEvolutionPath: (starId: string) => {
    try {
      const path = starCatalog.getEvolutionPath(starId);
      set({ evolutionPath: path });
    } catch (error) {
      console.error('Failed to load evolution path:', error);
      set({ evolutionPath: [] });
    }
  }
}));
