import { create } from 'zustand';
import type { MoodData, AnalysisData, ReportData } from './types';
import { getMoods, getAnalysisData, getWeeklyReport, createMood } from './api';

type ViewType = 'record' | 'calendar' | 'analysis' | 'report';

interface MoodStore {
  moods: MoodData[];
  currentView: ViewType;
  selectedTag: string | null;
  analysisData: AnalysisData | null;
  reportData: ReportData | null;
  isLoading: boolean;
  error: string | null;
  setMoods: (moods: MoodData[]) => void;
  addMood: (mood: MoodData) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedTag: (tag: string | null) => void;
  fetchMoods: (params?: { startDate?: string; endDate?: string; emotion?: string }) => Promise<void>;
  fetchAnalysis: (days?: number) => Promise<void>;
  fetchReport: () => Promise<void>;
  createNewMood: (data: Omit<MoodData, 'id' | 'timestamp'>) => Promise<void>;
}

export const useMoodStore = create<MoodStore>((set) => ({
  moods: [],
  currentView: 'record',
  selectedTag: null,
  analysisData: null,
  reportData: null,
  isLoading: false,
  error: null,

  setMoods: (moods) => set({ moods }),
  addMood: (mood) => set((state) => ({ moods: [mood, ...state.moods] })),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),

  fetchMoods: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMoods(params);
      set({ moods: response.data });
    } catch (error) {
      set({ error: '获取心情数据失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAnalysis: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAnalysisData(days);
      set({ analysisData: response.data });
    } catch (error) {
      set({ error: '获取分析数据失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getWeeklyReport();
      set({ reportData: response.data });
    } catch (error) {
      set({ error: '获取周报失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  createNewMood: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createMood(data);
      set((state) => ({ moods: [response.data, ...state.moods] }));
    } catch (error) {
      set({ error: '创建心情记录失败' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
