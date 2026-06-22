import { create } from 'zustand';
import type { FoodItem, FoodRecord, DailySummary, AnalysisResponse } from '@/types';
import {
  searchFood as apiSearchFood,
  addRecord as apiAddRecord,
  getRecordsByDate as apiGetRecordsByDate,
  deleteRecord as apiDeleteRecord,
  getAnalysis as apiGetAnalysis,
  getHistory as apiGetHistory,
} from '@/api';
import {
  calculateDailySummary,
  getTodayStr,
  calculateMacroRatio,
  generateRadarData,
  generateDiagnosis,
  getDateRange,
} from '@/utils/nutritionCalc';

interface FoodState {
  todayDate: string;
  todayRecords: FoodRecord[];
  todaySummary: DailySummary;
  searchResults: FoodItem[];
  selectedFood: FoodItem | null;
  grams: number;
  historyData: DailySummary[];
  analysisResult: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;

  searchFood: (query: string) => Promise<void>;
  selectFood: (food: FoodItem | null) => void;
  setGrams: (grams: number) => void;
  addRecord: (foodId: number, grams: number) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  fetchTodayRecords: () => Promise<void>;
  fetchHistory: (days: number) => Promise<void>;
  fetchAnalysis: (days: number) => Promise<void>;
  clearSearch: () => void;
}

const emptySummary: DailySummary = {
  date: getTodayStr(),
  totalCalories: 0,
  totalProtein: 0,
  totalFat: 0,
  totalCarbs: 0,
  totalFiber: 0,
  totalSodium: 0,
  records: [],
};

export const useFoodStore = create<FoodState>((set, get) => ({
  todayDate: getTodayStr(),
  todayRecords: [],
  todaySummary: { ...emptySummary },
  searchResults: [],
  selectedFood: null,
  grams: 100,
  historyData: [],
  analysisResult: null,
  isLoading: false,
  error: null,

  searchFood: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const results = await apiSearchFood({ q: query });
      set({ searchResults: results, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectFood: (food: FoodItem | null) => {
    set({ selectedFood: food, grams: food ? 100 : 100 });
  },

  setGrams: (grams: number) => {
    set({ grams });
  },

  addRecord: async (foodId: number, grams: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiAddRecord({ foodId, grams });
      const { fetchTodayRecords } = get();
      await fetchTodayRecords();
      set({ isLoading: false, selectedFood: null, searchResults: [] });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  removeRecord: async (id: number) => {
    try {
      await apiDeleteRecord(id);
      const { fetchTodayRecords } = get();
      await fetchTodayRecords();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchTodayRecords: async () => {
    const today = getTodayStr();
    set({ isLoading: true });
    try {
      const summary = await apiGetRecordsByDate(today);
      set({
        todayRecords: summary.records,
        todaySummary: summary,
        todayDate: today,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchHistory: async (days: number) => {
    set({ isLoading: true });
    try {
      const dateRange = getDateRange(days);
      const response = await apiGetHistory(dateRange[0], dateRange[dateRange.length - 1]);
      const filledData: DailySummary[] = dateRange.map((date) => {
        const found = response.data.find((d) => d.date === date);
        return (
          found || {
            date,
            totalCalories: 0,
            totalProtein: 0,
            totalFat: 0,
            totalCarbs: 0,
            totalFiber: 0,
            totalSodium: 0,
            records: [],
          }
        );
      });
      set({ historyData: filledData, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAnalysis: async (days: number) => {
    set({ isLoading: true });
    try {
      const result = await apiGetAnalysis(days);
      set({ analysisResult: result, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], selectedFood: null });
  },
}));

export { calculateMacroRatio, generateRadarData, generateDiagnosis };
