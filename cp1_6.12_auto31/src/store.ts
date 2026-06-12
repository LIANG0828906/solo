import { create } from 'zustand';
import type { Category, HistoryEvent } from './types';
import { events } from './data';

interface TimelineState {
  yearRange: [number, number];
  categories: Category[];
  searchKeyword: string;
  expandedYears: number[];
  favorites: string[];
  compareList: string[];
  highlightedEventId: string | null;
  scrollToYear: number | null;
  
  setYearRange: (range: [number, number]) => void;
  toggleCategory: (cat: Category) => void;
  setSearchKeyword: (kw: string) => void;
  toggleYear: (year: number) => void;
  toggleFavorite: (eventId: string) => void;
  toggleCompare: (eventId: string) => void;
  setHighlightedEvent: (eventId: string | null) => void;
  setScrollToYear: (year: number | null) => void;
  
  getFilteredEvents: () => HistoryEvent[];
  getFavoriteEvents: () => HistoryEvent[];
  getCompareEvents: () => HistoryEvent[];
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  yearRange: [1973, 2023],
  categories: [],
  searchKeyword: '',
  expandedYears: [],
  favorites: [],
  compareList: [],
  highlightedEventId: null,
  scrollToYear: null,

  setYearRange: (range) => {
    set({ yearRange: range, scrollToYear: range[0] });
  },

  toggleCategory: (cat) => {
    set((state) => {
      const hasCat = state.categories.includes(cat);
      return {
        categories: hasCat
          ? state.categories.filter((c) => c !== cat)
          : [...state.categories, cat],
      };
    });
  },

  setSearchKeyword: (kw) => set({ searchKeyword: kw }),

  toggleYear: (year) => {
    set((state) => {
      const isExpanded = state.expandedYears.includes(year);
      return {
        expandedYears: isExpanded
          ? state.expandedYears.filter((y) => y !== year)
          : [...state.expandedYears, year],
      };
    });
  },

  toggleFavorite: (eventId) => {
    set((state) => {
      const isFav = state.favorites.includes(eventId);
      return {
        favorites: isFav
          ? state.favorites.filter((id) => id !== eventId)
          : [...state.favorites, eventId],
      };
    });
  },

  toggleCompare: (eventId) => {
    set((state) => {
      const isInCompare = state.compareList.includes(eventId);
      if (isInCompare) {
        return {
          compareList: state.compareList.filter((id) => id !== eventId),
        };
      }
      if (state.compareList.length >= 3) {
        return state;
      }
      return {
        compareList: [...state.compareList, eventId],
      };
    });
  },

  setHighlightedEvent: (eventId) => set({ highlightedEventId: eventId }),

  setScrollToYear: (year) => set({ scrollToYear: year }),

  getFilteredEvents: () => {
    const { yearRange, categories, searchKeyword } = get();
    const [start, end] = yearRange;
    const keyword = searchKeyword.toLowerCase();

    return events.filter((e) => {
      if (e.year < start || e.year > end) return false;
      if (categories.length > 0 && !categories.includes(e.category)) return false;
      if (keyword && !e.title.toLowerCase().includes(keyword) && !e.description.toLowerCase().includes(keyword)) return false;
      return true;
    });
  },

  getFavoriteEvents: () => {
    const { favorites } = get();
    return events.filter((e) => favorites.includes(e.id));
  },

  getCompareEvents: () => {
    const { compareList } = get();
    return events.filter((e) => compareList.includes(e.id));
  },
}));
