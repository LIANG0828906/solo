import { create } from 'zustand';
import type { Travelog } from '../types';

interface TravelogState {
  travelogs: Travelog[];
  currentTravelog: Travelog | null;
  loading: boolean;
  error: string | null;
  fetchTravelogs: () => Promise<void>;
  fetchTravelog: (id: string) => Promise<void>;
  createTravelog: (title: string, content: string, checkinIds: string[]) => Promise<Travelog | null>;
  deleteTravelog: (id: string) => Promise<void>;
  setCurrentTravelog: (travelog: Travelog | null) => void;
}

export const useTravelogStore = create<TravelogState>((set) => ({
  travelogs: [],
  currentTravelog: null,
  loading: false,
  error: null,

  fetchTravelogs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/travelogs');
      if (!response.ok) throw new Error('获取游记列表失败');
      const data = await response.json();
      set({ travelogs: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTravelog: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/travelog/${id}`);
      if (!response.ok) throw new Error('获取游记详情失败');
      const data = await response.json();
      set({ currentTravelog: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createTravelog: async (title: string, content: string, checkinIds: string[]) => {
    try {
      const response = await fetch('/api/travelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, checkinIds }),
      });
      if (!response.ok) throw new Error('创建游记失败');
      const newTravelog = await response.json();
      set((state) => ({
        travelogs: [newTravelog, ...state.travelogs],
      }));
      return newTravelog;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  deleteTravelog: async (id: string) => {
    try {
      const response = await fetch(`/api/travelog/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除游记失败');
      set((state) => ({
        travelogs: state.travelogs.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setCurrentTravelog: (travelog: Travelog | null) => {
    set({ currentTravelog: travelog });
  },
}));
