import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';
import { StarData, constellations, ConstellationData } from '../utils/starData';

interface StarStore {
  constellations: ConstellationData[];
  selectedStar: StarData | null;
  currentSeason: string;
  favorites: StarData[];
  showConnections: boolean;
  isRoaming: boolean;
  
  init: () => Promise<void>;
  setSelectedStar: (star: StarData | null) => void;
  setCurrentSeason: (season: string) => void;
  setShowConnections: (show: boolean) => void;
  toggleShowConnections: () => void;
  addFavorite: (star: StarData) => Promise<void>;
  removeFavorite: (starId: string) => Promise<void>;
  isFavorite: (starId: string) => boolean;
  setIsRoaming: (roaming: boolean) => void;
}

export const useStarStore = create<StarStore>((set, get) => ({
  constellations: [],
  selectedStar: null,
  currentSeason: 'spring',
  favorites: [],
  showConnections: true,
  isRoaming: false,

  init: async () => {
    try {
      const storedFavorites = await get<StarData[]>('favorites');
      if (storedFavorites && Array.isArray(storedFavorites)) {
        set({ favorites: storedFavorites });
      }
    } catch (e) {
      console.error('Failed to load favorites from IndexedDB:', e);
    }
    set({ constellations });
  },

  setSelectedStar: (star) => set({ selectedStar: star }),
  
  setCurrentSeason: (season) => set({ currentSeason: season }),
  
  setShowConnections: (show) => set({ showConnections: show }),
  
  toggleShowConnections: () => set({ showConnections: !get().showConnections }),

  addFavorite: async (star) => {
    const { favorites } = get();
    if (!favorites.find(s => s.id === star.id)) {
      const newFavorites = [...favorites, star];
      set({ favorites: newFavorites });
      try {
        await set('favorites', newFavorites);
      } catch (e) {
        console.error('Failed to save favorite to IndexedDB:', e);
      }
    }
  },

  removeFavorite: async (starId) => {
    const { favorites } = get();
    const newFavorites = favorites.filter(s => s.id !== starId);
    set({ favorites: newFavorites });
    try {
      await set('favorites', newFavorites);
    } catch (e) {
      console.error('Failed to remove favorite from IndexedDB:', e);
    }
  },

  isFavorite: (starId) => {
    return get().favorites.some(s => s.id === starId);
  },

  setIsRoaming: (roaming) => set({ isRoaming: roaming })
}));
