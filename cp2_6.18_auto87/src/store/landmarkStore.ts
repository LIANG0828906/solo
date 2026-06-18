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

export const useLandmarkStore = create<LandmarkStore>()(
  persist(
    (set, get) => ({
      cities,
      allLandmarks: landmarks,
      currentCityId: 'beijing',
      selectedLandmarkId: null,
      searchQuery: '',
      favoriteIds: [],
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
        if (favoriteIds.includes(landmarkId)) {
          set({ favoriteIds: favoriteIds.filter((id) => id !== landmarkId) });
        } else {
          set({ favoriteIds: [...favoriteIds, landmarkId] });
        }
      },
      clearFavorites: () => {
        set({ favoriteIds: [] });
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
      name: 'citylens-storage',
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
        currentCityId: state.currentCityId,
      }),
    }
  )
);
