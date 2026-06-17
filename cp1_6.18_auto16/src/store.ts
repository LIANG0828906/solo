import { create } from 'zustand';
import type { YearEvent } from './mockData';

interface AppState {
  currentMonth: number;
  selectedEvent: YearEvent | null;
  sentimentFilter: 'all' | 'positive' | 'neutral' | 'negative';
  showReview: boolean;
  setMonth: (month: number) => void;
  setSelectedEvent: (event: YearEvent | null) => void;
  setSentimentFilter: (filter: 'all' | 'positive' | 'neutral' | 'negative') => void;
  setShowReview: (show: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  currentMonth: new Date().getMonth(),
  selectedEvent: null,
  sentimentFilter: 'all',
  showReview: false,
  setMonth: (month) => set({ currentMonth: month }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setSentimentFilter: (filter) => set({ sentimentFilter: filter }),
  setShowReview: (show) => set({ showReview: show }),
}));
