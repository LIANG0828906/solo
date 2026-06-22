import { create } from 'zustand';
import type { Travelog } from '@/types';

interface TravelogState {
  travelogs: Travelog[];
  loading: boolean;
  fetchTravelogs: () => Promise<void>;
  createTravelog: (
    title: string,
    content: string,
    checkinIds: string[]
  ) => Promise<Travelog | null>;
  deleteTravelog: (id: string) => Promise<void>;
  getTravelogById: (id: string) => Travelog | undefined;
}

export const useTravelogStore = create<TravelogState>((set, get) => ({
  travelogs: [],
  loading: false,

  fetchTravelogs: async () => {
    try {
      set({ loading: true });
      const res = await fetch('/api/travelogs');
      const data = await res.json();
      if (data.success) {
        set({ travelogs: data.data });
      }
    } catch (err) {
      console.error('获取游记列表失败:', err);
    } finally {
      set({ loading: false });
    }
  },

  createTravelog: async (title, content, checkinIds) => {
    try {
      const res = await fetch('/api/travelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, checkinIds }),
      });
      const data = await res.json();
      if (data.success) {
        set((state) => ({ travelogs: [...state.travelogs, data.data] }));
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('创建游记失败:', err);
      return null;
    }
  },

  deleteTravelog: async (id) => {
    try {
      const res = await fetch(`/api/travelog/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          travelogs: state.travelogs.filter((t) => t.id !== id),
        }));
      }
    } catch (err) {
      console.error('删除游记失败:', err);
    }
  },

  getTravelogById: (id) => {
    return get().travelogs.find((t) => t.id === id);
  },
}));
