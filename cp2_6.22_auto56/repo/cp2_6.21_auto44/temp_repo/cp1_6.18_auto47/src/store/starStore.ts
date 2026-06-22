import { create } from 'zustand';
import type { StarData, SpectralType, StarStoreState, StarStoreActions } from '@/types/star';
import { fetchStars } from '@/services/starApi';

type StarStore = StarStoreState & StarStoreActions;

export const useStarStore = create<StarStore>((set, get) => ({
  stars: [],
  selectedStarId: null,
  filterSpectralTypes: [],
  isLoading: false,

  setStars: (stars: StarData[]) => set({ stars }),

  selectStar: (id: string | null) => set({ selectedStarId: id }),

  toggleSpectralFilter: (type: SpectralType) => {
    const currentFilters = get().filterSpectralTypes;
    const newFilters = currentFilters.includes(type)
      ? currentFilters.filter((t) => t !== type)
      : [...currentFilters, type];
    set({ filterSpectralTypes: newFilters });
  },

  clearFilters: () => set({ filterSpectralTypes: [] }),

  fetchStars: async () => {
    set({ isLoading: true });
    try {
      const stars = await fetchStars();
      set({ stars, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch stars:', error);
      set({ isLoading: false });
    }
  },

  getFilteredStars: (): StarData[] => {
    const { stars, filterSpectralTypes } = get();
    if (filterSpectralTypes.length === 0) return stars;
    return stars.filter((star) => filterSpectralTypes.includes(star.spectralType));
  },

  isStarVisible: (starId: string): boolean => {
    const { stars, filterSpectralTypes } = get();
    if (filterSpectralTypes.length === 0) return true;
    const star = stars.find((s) => s.id === starId);
    if (!star) return false;
    return filterSpectralTypes.includes(star.spectralType);
  },
}));

export default useStarStore;
