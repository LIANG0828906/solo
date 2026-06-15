import { create } from 'zustand';
import type { Tea, TeaFilters } from '@/types';
import { teaStore } from '@/data/teaStore';

interface TeaState {
  teas: Tea[];
  loading: boolean;
  filters: TeaFilters;
  loadTeas: (filters?: TeaFilters) => Promise<void>;
  addTea: (data: Omit<Tea, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Tea>;
  updateTea: (id: string, data: Partial<Tea>) => Promise<Tea | null>;
  deleteTea: (id: string) => Promise<boolean>;
  setFilters: (filters: TeaFilters) => void;
}

export const useTeaStore = create<TeaState>((set, get) => ({
  teas: [],
  loading: false,
  filters: {},

  async loadTeas(filters) {
    set({ loading: true });
    const f = filters ?? get().filters;
    const teas = await teaStore.getAll(f);
    set({ teas, loading: false, filters: f });
  },

  async addTea(data) {
    const tea = await teaStore.add(data);
    await get().loadTeas();
    return tea;
  },

  async updateTea(id, data) {
    const result = await teaStore.update(id, data);
    await get().loadTeas();
    return result;
  },

  async deleteTea(id) {
    const ok = await teaStore.delete(id);
    if (ok) await get().loadTeas();
    return ok;
  },

  setFilters(filters) {
    set({ filters });
  },
}));
