import { create } from 'zustand';
import type { Constellation } from './starsData';

interface StarStore {
  selectedConstellation: Constellation | null;
  hoveredStarId: string | null;
  hoveredConstellationId: string | null;
  isChartUnfolded: boolean;
  viewMode: 'dome' | 'chart';
  searchQuery: string;
  searchResult: string | null;
  highlightedConstellationId: string | null;
  favorites: string[];
  isSearching: boolean;
  
  setSelectedConstellation: (c: Constellation | null) => void;
  setHoveredStarId: (id: string | null) => void;
  setHoveredConstellationId: (id: string | null) => void;
  setIsChartUnfolded: (v: boolean) => void;
  toggleViewMode: () => void;
  setViewMode: (mode: 'dome' | 'chart') => void;
  setSearchQuery: (q: string) => void;
  setSearchResult: (r: string | null) => void;
  setHighlightedConstellationId: (id: string | null) => void;
  setIsSearching: (v: boolean) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  resetAll: () => void;
}

export const useStarStore = create<StarStore>((set) => ({
  selectedConstellation: null,
  hoveredStarId: null,
  hoveredConstellationId: null,
  isChartUnfolded: false,
  viewMode: 'dome',
  searchQuery: '',
  searchResult: null,
  highlightedConstellationId: null,
  favorites: [],
  isSearching: false,

  setSelectedConstellation: (c) => set({ selectedConstellation: c }),
  setHoveredStarId: (id) => set({ hoveredStarId: id }),
  setHoveredConstellationId: (id) => set({ hoveredConstellationId: id }),
  setIsChartUnfolded: (v) => set({ isChartUnfolded: v }),
  toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'dome' ? 'chart' : 'dome' })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResult: (r) => set({ searchResult: r }),
  setHighlightedConstellationId: (id) => set({ highlightedConstellationId: id }),
  setIsSearching: (v) => set({ isSearching: v }),
  
  addFavorite: (id) => set((state) => {
    if (state.favorites.includes(id)) return state;
    const newFavorites = [...state.favorites, id];
    if (newFavorites.length > 5) newFavorites.shift();
    return { favorites: newFavorites };
  }),
  
  removeFavorite: (id) => set((state) => ({
    favorites: state.favorites.filter((f) => f !== id)
  })),
  
  resetAll: () => set({
    selectedConstellation: null,
    hoveredStarId: null,
    hoveredConstellationId: null,
    highlightedConstellationId: null,
    searchResult: null
  })
}));
