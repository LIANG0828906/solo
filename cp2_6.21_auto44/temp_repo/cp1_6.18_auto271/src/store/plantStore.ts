import { create } from 'zustand';
import { Plant, TodayReminder } from '../types';

interface PlantStore {
  plants: Plant[];
  todayReminder: TodayReminder | null;
  loading: boolean;
  error: string | null;

  fetchPlants: () => Promise<void>;
  addPlant: (data: Omit<Plant, 'id' | 'growthRecords' | 'lastWateredDate'>) => Promise<Plant | null>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  fetchTodayReminders: () => Promise<void>;
  waterPlant: (id: string) => Promise<void>;
  addGrowthRecord: (plantId: string, content: string) => Promise<boolean>;
}

const API_BASE = '/api';

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  todayReminder: null,
  loading: false,
  error: null,

  fetchPlants: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/plants`);
      if (!res.ok) throw new Error('获取植物列表失败');
      const data = (await res.json()) as Plant[];
      set({ plants: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
    } finally {
      set({ loading: false });
    }
  },

  addPlant: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/plants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('添加植物失败');
      const newPlant = (await res.json()) as Plant;
      set((state) => ({ plants: [...state.plants, newPlant] }));
      return newPlant;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updatePlant: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/plants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('更新植物失败');
      const updated = (await res.json()) as Plant;
      set((state) => ({
        plants: state.plants.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
    } finally {
      set({ loading: false });
    }
  },

  deletePlant: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/plants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除植物失败');
      set((state) => ({
        plants: state.plants.filter((p) => p.id !== id),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTodayReminders: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/today-reminders`);
      if (!res.ok) throw new Error('获取今日提醒失败');
      const data = (await res.json()) as TodayReminder;
      set({ todayReminder: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
    } finally {
      set({ loading: false });
    }
  },

  waterPlant: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/plants/${id}/water`, { method: 'POST' });
      if (!res.ok) throw new Error('浇水失败');
      const updated = (await res.json()) as Plant;
      set((state) => ({
        plants: state.plants.map((p) => (p.id === id ? updated : p)),
        todayReminder: state.todayReminder
          ? {
              count: state.todayReminder.count - 1,
              plants: state.todayReminder.plants.filter((p) => p.id !== id),
            }
          : null,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
    } finally {
      set({ loading: false });
    }
  },

  addGrowthRecord: async (plantId, content) => {
    try {
      const res = await fetch(`${API_BASE}/plants/${plantId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || '添加记录失败');
      }
      const newRecord = await res.json();
      set((state) => ({
        plants: state.plants.map((p) =>
          p.id === plantId
            ? { ...p, growthRecords: [newRecord, ...p.growthRecords] }
            : p
        ),
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '未知错误' });
      return false;
    }
  },
}));
