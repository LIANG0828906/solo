import { create } from 'zustand';
import type { Plant, ExchangeRequest, DiaryEntry } from '../types';

interface PlantState {
  plants: Plant[];
  exchangeRequests: ExchangeRequest[];
  diaryEntries: DiaryEntry[];
  currentUserId: string;
  loading: boolean;
  fetchPlants: () => Promise<void>;
  addPlant: (formData: FormData) => Promise<Plant | null>;
  requestExchange: (fromPlantId: string, toPlantId: string) => Promise<{ request: ExchangeRequest; matched: boolean } | null>;
  confirmExchange: (requestId: string) => Promise<ExchangeRequest | null>;
  fetchDiaryEntries: () => Promise<void>;
  addDiaryEntry: (plantId: string, type: DiaryEntry['type'], note: string) => Promise<DiaryEntry | null>;
  fetchExchanges: () => Promise<void>;
}

export const usePlantStore = create<PlantState>((set, get) => ({
  plants: [],
  exchangeRequests: [],
  diaryEntries: [],
  currentUserId: 'user-1',
  loading: false,

  fetchPlants: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/plants');
      const data = await res.json();
      set({ plants: data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  },

  addPlant: async (formData: FormData) => {
    try {
      const res = await fetch('/api/plants', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) return null;
      const data = await res.json();
      set(state => ({ plants: [...state.plants, data] }));
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  requestExchange: async (fromPlantId: string, toPlantId: string) => {
    try {
      const res = await fetch('/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPlantId, toPlantId })
      });
      if (!res.ok) return null;
      const data = await res.json();
      set(state => ({
        plants: state.plants.map(p => {
          if (p.id === fromPlantId || p.id === toPlantId) {
            return { ...p, status: data.matched ? 'exchanged' : 'pending' };
          }
          return p;
        }),
        exchangeRequests: data.matched
          ? state.exchangeRequests.map(r => r.id === data.request.id ? data.request : r)
          : [...state.exchangeRequests, data.request]
      }));
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  confirmExchange: async (requestId: string) => {
    try {
      const res = await fetch(`/api/exchanges/${requestId}/confirm`, {
        method: 'POST'
      });
      if (!res.ok) return null;
      const data = await res.json();
      set(state => ({
        exchangeRequests: state.exchangeRequests.map(r => r.id === requestId ? data : r),
        plants: state.plants.map(p => {
          if (p.id === data.fromPlantId || p.id === data.toPlantId) {
            return { ...p, status: 'exchanged' };
          }
          return p;
        })
      }));
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  fetchDiaryEntries: async () => {
    try {
      const res = await fetch('/api/diary');
      const data = await res.json();
      set({ diaryEntries: data });
    } catch (e) {
      console.error(e);
    }
  },

  addDiaryEntry: async (plantId: string, type: DiaryEntry['type'], note: string) => {
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantId, type, note })
      });
      if (!res.ok) return null;
      const data = await res.json();
      set(state => ({ diaryEntries: [...state.diaryEntries, data] }));
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  fetchExchanges: async () => {
    try {
      const res = await fetch('/api/exchanges');
      const data = await res.json();
      set({ exchangeRequests: data });
    } catch (e) {
      console.error(e);
    }
  }
}));
