import { create } from 'zustand';
import axios from 'axios';
import type { ReadingRecord, BookRecommendation } from '../types';

interface AppState {
  records: ReadingRecord[];
  recommendations: BookRecommendation[];
  loading: boolean;
  error: string | null;
  fetchRecords: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  addRecord: (record: Omit<ReadingRecord, 'id'>) => Promise<boolean>;
  fetchAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  records: [],
  recommendations: [],
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<ReadingRecord[]>('/api/records');
      set({ records: res.data });
    } catch (err) {
      set({ error: '获取阅读记录失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<BookRecommendation[]>('/api/recommendations');
      set({ recommendations: res.data });
    } catch (err) {
      set({ error: '获取推荐列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  addRecord: async (record) => {
    set({ error: null });
    try {
      await axios.post('/api/records', record);
      return true;
    } catch (err) {
      set({ error: '提交记录失败' });
      return false;
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [recordsRes, recsRes] = await Promise.all([
        axios.get<ReadingRecord[]>('/api/records'),
        axios.get<BookRecommendation[]>('/api/recommendations'),
      ]);
      set({ records: recordsRes.data, recommendations: recsRes.data });
    } catch (err) {
      set({ error: '加载数据失败' });
    } finally {
      set({ loading: false });
    }
  },
}));
