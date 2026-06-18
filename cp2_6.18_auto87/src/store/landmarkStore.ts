import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { City, Landmark, SortType } from '../types';
import { cities, landmarks } from '../data/landmarks';

interface LandmarkStore {
  cities: City[];
  allLandmarks: Landmark[];
  currentCityId: string;
  selectedLandmarkId: string | null;
  searchQuery: string;
  favoriteIds: string[];
  showFavoritesSidebar: boolean;
  reviewSortType: SortType;

  setCurrentCity: (cityId: string) => void;
  setSelectedLandmark: (landmarkId: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (landmarkId: string) => void;
  clearFavorites: () => void;
  setShowFavoritesSidebar: (show: boolean) => void;
  setReviewSortType: (type: SortType) => void;

  currentCity: City | undefined;
  filteredLandmarks: Landmark[];
  cityLandmarks: Landmark[];
  favoriteLandmarks: Landmark[];
  selectedLandmark: Landmark | undefined;
}

const STORAGE_KEY = 'citylens-storage';

const loadFromStorage = (): { favoriteIds: string[]; currentCityId: string } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        favoriteIds: Array.isArray(parsed.favoriteIds) ? parsed.favoriteIds : [],
        currentCityId: typeof parsed.currentCityId === 'string' ? parsed.currentCityId : 'beijing',
      };
    }
  } catch {
    // ignore parse errors
  }
  return null;
};

const persistedState = loadFromStorage();

export const useLandmarkStore = create<LandmarkStore>()(
  persist(
    (set, get) => ({
      cities,
      allLandmarks: landmarks,
      currentCityId: persistedState?.currentCityId || 'beijing',
      selectedLandmarkId: null,
      searchQuery: '',
      favoriteIds: persistedState?.favoriteIds || [],
      showFavoritesSidebar: false,
      reviewSortType: 'time',

      setCurrentCity: (cityId) => {
        set({ currentCityId: cityId, selectedLandmarkId: null });
      },
      setSelectedLandmark: (landmarkId) => {
        set({ selectedLandmarkId: landmarkId });
      },
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      toggleFavorite: (landmarkId) => {
        const { favoriteIds } = get();
        let newFavoriteIds: string[];
        if (favoriteIds.includes(landmarkId)) {
          newFavoriteIds = favoriteIds.filter((id) => id !== landmarkId);
        } else {
          newFavoriteIds = [...favoriteIds, landmarkId];
        }
        set({ favoriteIds: newFavoriteIds });
        try {
          const currentData = loadFromStorage() || { favoriteIds: [], currentCityId: get().currentCityId };
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...currentData,
            favoriteIds: newFavoriteIds,
          }));
        } catch {
          // ignore storage errors
        }
      },
      clearFavorites: () => {
        set({ favoriteIds: [] });
        try {
          const currentData = loadFromStorage() || { favoriteIds: [], currentCityId: get().currentCityId };
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...currentData,
            favoriteIds: [],
          }));
        } catch {
          // ignore storage errors
        }
      },
      setShowFavoritesSidebar: (show) => {
        set({ showFavoritesSidebar: show });
      },
      setReviewSortType: (type) => {
        set({ reviewSortType: type });
      },

      get currentCity() {
        return get().cities.find((c) => c.id === get().currentCityId);
      },
      get cityLandmarks() {
        return get().allLandmarks.filter((l) => l.cityId === get().currentCityId);
      },
      get filteredLandmarks() {
        const query = get().searchQuery.toLowerCase().trim();
        const cityLandmarks = get().cityLandmarks;
        if (!query) return cityLandmarks;
        return cityLandmarks.filter((l) =>
          l.name.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query)
        );
      },
      get favoriteLandmarks() {
        const { favoriteIds, allLandmarks } = get();
        return allLandmarks.filter((l) => favoriteIds.includes(l.id));
      },
      get selectedLandmark() {
        return get().allLandmarks.find((l) => l.id === get().selectedLandmarkId);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
        currentCityId: state.currentCityId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              favoriteIds: state.favoriteIds,
              currentCityId: state.currentCityId,
            }));
          } catch {
            // ignore storage errors
          }
        }
      },
    }
  )
);

useLandmarkStore.subscribe(
  (state) => state.favoriteIds,
  (favoriteIds) => {
    try {
      const currentData = loadFromStorage() || { favoriteIds: [], currentCityId: useLandmarkStore.getState().currentCityId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...currentData,
        favoriteIds,
      }));
    } catch {
      // ignore storage errors
    }
  }
);

useLandmarkStore.subscribe(
  (state) => state.currentCityId,
  (currentCityId) => {
    try {
      const currentData = loadFromStorage() || { favoriteIds: [], currentCityId: 'beijing' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...currentData,
        currentCityId,
      }));
    } catch {
      // ignore storage errors
    }
  }
);
