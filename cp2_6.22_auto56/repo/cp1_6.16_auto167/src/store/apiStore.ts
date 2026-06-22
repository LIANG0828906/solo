import { create } from 'zustand';
import { Exhibit, LayoutData } from '@/types';

interface ApiStore {
  exhibits: Exhibit[];
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;

  fetchExhibits: () => Promise<void>;
  saveLayoutToServer: (data: LayoutData) => Promise<string | null>;
  loadLayoutFromServer: (id: string) => Promise<LayoutData | null>;
  setExporting: (val: boolean) => void;
}

export const useApiStore = create<ApiStore>((set) => ({
  exhibits: [],
  isLoading: false,
  isExporting: false,
  error: null,

  fetchExhibits: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/exhibits');
      if (!res.ok) throw new Error('获取展品库失败');
      const data = await res.json();
      set({ exhibits: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  saveLayoutToServer: async (data) => {
    set({ error: null });
    try {
      const res = await fetch('/api/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error('保存布局失败');
      const result = await res.json();
      return result.id as string;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  loadLayoutFromServer: async (id) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/layout/${id}`);
      if (!res.ok) throw new Error('加载布局失败');
      const result = await res.json();
      return result.data as LayoutData;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  setExporting: (val) => set({ isExporting: val }),
}));
