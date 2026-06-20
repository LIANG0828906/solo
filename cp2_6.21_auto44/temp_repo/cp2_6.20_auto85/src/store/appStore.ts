import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { solarTerms, regions } from '@/data/regionData';
import type {
  ItineraryItem,
  Specialty,
  Activity,
  SolarTerm,
  SelectedMarker,
  FilterType,
} from '@/types';

interface AppState {
  currentSolarTerm: string;
  selectedMarker: SelectedMarker | null;
  itinerary: ItineraryItem[];
  searchQuery: string;
  filterType: FilterType;
  showDetailPanel: boolean;
  showItineraryPanel: boolean;

  setCurrentSolarTerm: (id: string) => void;
  setSelectedMarker: (marker: SelectedMarker | null) => void;
  addToItinerary: (item: Omit<ItineraryItem, 'id' | 'addedAt'>) => void;
  removeFromItinerary: (id: string) => void;
  reorderItinerary: (fromIndex: number, toIndex: number) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: FilterType) => void;
  toggleDetailPanel: (show?: boolean) => void;
  toggleItineraryPanel: (show?: boolean) => void;

  getCurrentSolarTermData: () => SolarTerm | undefined;
  getFilteredItems: () => { specialties: Specialty[]; activities: Activity[] };
  getSearchResults: () => Array<{
    id: string;
    name: string;
    type: 'specialty' | 'activity';
    itemType: string;
  }>;
  getItineraryStats: () => { totalItems: number; totalDays: number };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentSolarTerm: solarTerms[0].id,
  selectedMarker: null,
  itinerary: [],
  searchQuery: '',
  filterType: 'all',
  showDetailPanel: false,
  showItineraryPanel: false,

  setCurrentSolarTerm: (id: string) => set({ currentSolarTerm: id }),

  setSelectedMarker: (marker: SelectedMarker | null) => set({ selectedMarker: marker }),

  addToItinerary: (item: Omit<ItineraryItem, 'id' | 'addedAt'>) => {
    const newItem: ItineraryItem = {
      ...item,
      id: uuidv4(),
      addedAt: Date.now(),
    };
    set((state) => ({ itinerary: [...state.itinerary, newItem] }));
  },

  removeFromItinerary: (id: string) => {
    set((state) => ({
      itinerary: state.itinerary.filter((item) => item.id !== id),
    }));
  },

  reorderItinerary: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const result = Array.from(state.itinerary);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return { itinerary: result };
    });
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setFilterType: (type: FilterType) => set({ filterType: type }),

  toggleDetailPanel: (show?: boolean) => {
    set((state) => ({
      showDetailPanel: show !== undefined ? show : !state.showDetailPanel,
    }));
  },

  toggleItineraryPanel: (show?: boolean) => {
    set((state) => ({
      showItineraryPanel: show !== undefined ? show : !state.showItineraryPanel,
    }));
  },

  getCurrentSolarTermData: () => {
    const { currentSolarTerm } = get();
    return solarTerms.find((term) => term.id === currentSolarTerm);
  },

  getFilteredItems: () => {
    const { currentSolarTerm, filterType } = get();

    const allSpecialties = regions.flatMap((region) => region.specialties);
    const allActivities = regions.flatMap((region) => region.activities);

    const specialtiesByTerm = allSpecialties.filter((s) =>
      s.solarTerms.includes(currentSolarTerm)
    );
    const activitiesByTerm = allActivities.filter((a) =>
      a.solarTerms.includes(currentSolarTerm)
    );

    if (filterType === 'all') {
      return { specialties: specialtiesByTerm, activities: activitiesByTerm };
    }

    if (filterType === 'food') {
      return {
        specialties: specialtiesByTerm.filter(
          (s) => s.type === 'food' || s.type === 'fruit' || s.type === 'vegetable'
        ),
        activities: [],
      };
    }

    if (filterType === 'harvest') {
      return {
        specialties: specialtiesByTerm,
        activities: activitiesByTerm.filter(
          (a) => a.type === 'harvest' || a.type === 'sowing'
        ),
      };
    }

    if (filterType === 'festival') {
      return {
        specialties: [],
        activities: activitiesByTerm.filter((a) => a.type === 'festival'),
      };
    }

    return { specialties: [], activities: [] };
  },

  getSearchResults: () => {
    const { searchQuery } = get();
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const allSpecialties = regions.flatMap((region) => region.specialties);
    const allActivities = regions.flatMap((region) => region.activities);

    const results: Array<{
      id: string;
      name: string;
      type: 'specialty' | 'activity';
      itemType: string;
    }> = [];

    allSpecialties
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      )
      .forEach((s) => {
        results.push({
          id: s.id,
          name: s.name,
          type: 'specialty',
          itemType: s.type,
        });
      });

    allActivities
      .filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      )
      .forEach((a) => {
        results.push({
          id: a.id,
          name: a.name,
          type: 'activity',
          itemType: a.type,
        });
      });

    return results;
  },

  getItineraryStats: () => {
    const { itinerary } = get();
    const totalItems = itinerary.length;
    const uniqueDates = new Set(itinerary.map((item) => item.date));
    const totalDays = uniqueDates.size;
    return { totalItems, totalDays };
  },
}));
