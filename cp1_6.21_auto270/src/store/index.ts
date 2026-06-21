import { create } from 'zustand';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type { Inspiration, Filters, RecordMode } from '@/types';

interface InspirationState {
  inspirations: Inspiration[];
  filters: Filters;
  allTags: string[];
  recordMode: RecordMode;
  randomInspiration: Inspiration | null;
  showRandom: boolean;
  loading: boolean;
  socket: Socket | null;
  initSocket: () => void;
  fetchInspirations: () => Promise<void>;
  fetchTags: () => Promise<void>;
  createInspiration: (data: Omit<Inspiration, 'id' | 'createdAt'>) => Promise<Inspiration>;
  deleteInspiration: (id: string) => Promise<void>;
  setFilters: (filters: Partial<Filters>) => void;
  setRecordMode: (mode: RecordMode) => void;
  openRandom: () => Promise<void>;
  closeRandom: () => void;
  getFilteredInspirations: () => Inspiration[];
}

export const useInspirationStore = create<InspirationState>((set, get) => ({
  inspirations: [],
  filters: { tags: [], types: [], dateRange: null },
  allTags: [],
  recordMode: null,
  randomInspiration: null,
  showRandom: false,
  loading: false,
  socket: null,

  initSocket: () => {
    if (get().socket) return;
    const socket = io();
    socket.on('inspiration:created', (inspiration: Inspiration) => {
      set((state) => ({
        inspirations: [inspiration, ...state.inspirations],
      }));
    });
    socket.on('inspiration:deleted', (id: string) => {
      set((state) => ({
        inspirations: state.inspirations.filter((i) => i.id !== id),
      }));
    });
    set({ socket });
  },

  fetchInspirations: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get<Inspiration[]>('/api/inspirations');
      set({ inspirations: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTags: async () => {
    try {
      const { data } = await axios.get<string[]>('/api/tags');
      set({ allTags: data });
    } catch {
      /* ignore */
    }
  },

  createInspiration: async (data) => {
    const { data: created } = await axios.post<Inspiration>('/api/inspirations', data);
    return created;
  },

  deleteInspiration: async (id) => {
    await axios.delete(`/api/inspirations/${id}`);
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters }));
  },

  setRecordMode: (mode) => set({ recordMode: mode }),

  openRandom: async () => {
    try {
      const { data } = await axios.get<Inspiration>('/api/inspirations/random');
      set({ randomInspiration: data, showRandom: true });
    } catch {
      /* ignore */
    }
  },

  closeRandom: () => set({ showRandom: false, randomInspiration: null }),

  getFilteredInspirations: () => {
    const { inspirations, filters } = get();
    return inspirations.filter((item) => {
      if (filters.types.length > 0 && !filters.types.includes(item.type)) return false;
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some((t) => item.tags.includes(t));
        if (!hasTag) return false;
      }
      if (filters.dateRange) {
        if (item.createdAt < filters.dateRange.start || item.createdAt > filters.dateRange.end) return false;
      }
      return true;
    });
  },
}));
