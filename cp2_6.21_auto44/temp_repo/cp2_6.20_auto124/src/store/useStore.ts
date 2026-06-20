import { create } from 'zustand';
import type { TrainingRecord, Achievement, MonthStats } from '@/types';
import { recordApi, achievementApi, statsApi } from '@/utils/api';

interface AppState {
  records: TrainingRecord[];
  achievements: Achievement[];
  monthStats: MonthStats | null;
  loading: boolean;
  error: string | null;

  fetchRecords: () => Promise<void>;
  addRecord: (data: { type: string; duration: number; date: string; note: string }) => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchMonthStats: (month: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  records: [],
  achievements: [],
  monthStats: null,
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const data = await recordApi.getAll();
      set({ records: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || '获取记录失败', loading: false });
    }
  },

  addRecord: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRecord = await recordApi.create(data as any);
      const currentRecords = get().records;
      set({ 
        records: [newRecord, ...currentRecords].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        loading: false 
      });
      get().fetchAchievements();
    } catch (err: any) {
      set({ error: err.message || '添加记录失败', loading: false });
    }
  },

  fetchAchievements: async () => {
    try {
      const data = await achievementApi.getAll();
      set({ achievements: data });
    } catch (err: any) {
      console.error('获取成就失败:', err.message);
    }
  },

  fetchMonthStats: async (month: string) => {
    set({ loading: true, error: null });
    try {
      const data = await statsApi.getMonthStats(month);
      set({ monthStats: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || '获取统计数据失败', loading: false });
    }
  },
}));
