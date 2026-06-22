import { create } from 'zustand';
import type { TrainingRecord, Achievement, StatsData } from '../types';
import { getRecords, createRecord, getAchievements, getStats } from '../utils/api';

interface AppState {
  records: TrainingRecord[];
  achievements: Achievement[];
  stats: StatsData | null;
  loading: boolean;
  error: string | null;
  fetchRecords: () => Promise<void>;
  addRecord: (data: Omit<TrainingRecord, 'id' | 'created_at'>) => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchStats: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  records: [],
  achievements: [],
  stats: null,
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const records = await getRecords();
      set({ records, loading: false });
    } catch (error) {
      set({ error: '获取训练记录失败', loading: false });
    }
  },

  addRecord: async (data) => {
    set({ loading: true, error: null });
    try {
      const newRecord = await createRecord(data);
      set((state) => ({
        records: [...state.records, newRecord],
        loading: false,
      }));
    } catch (error) {
      set({ error: '添加训练记录失败', loading: false });
      throw error;
    }
  },

  fetchAchievements: async () => {
    set({ loading: true, error: null });
    try {
      const achievements = await getAchievements();
      set({ achievements, loading: false });
    } catch (error) {
      set({ error: '获取成就列表失败', loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await getStats();
      set({ stats, loading: false });
    } catch (error) {
      set({ error: '获取统计数据失败', loading: false });
    }
  },
}));
