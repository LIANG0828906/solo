import { create } from 'zustand';
import type { Garden, ClaimGardenRequest, AddWaterLogRequest } from '../../shared/types';
import {
  fetchGardens,
  claimGarden as apiClaimGarden,
  addWaterLog as apiAddWaterLog,
  harvestGarden as apiHarvestGarden,
} from '../api/api';

interface GardenState {
  gardenList: Garden[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchGardens: () => Promise<void>;
  claimGarden: (id: string, body: ClaimGardenRequest) => Promise<void>;
  addWaterLog: (id: string, body: AddWaterLogRequest) => Promise<void>;
  harvestGarden: (id: string) => Promise<void>;
}

export const useGardenStore = create<GardenState>((set, get) => ({
  gardenList: [],
  loading: false,
  error: null,
  fetched: false,
  fetchGardens: async () => {
    if (get().fetched && get().gardenList.length > 0) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await fetchGardens();
      set({ gardenList: data, loading: false, fetched: true });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  claimGarden: async (id, body) => {
    set({ loading: true, error: null });
    try {
      const updated = await apiClaimGarden(id, body);
      set((state) => ({
        gardenList: state.gardenList.map((g) => (g.id === id ? updated : g)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  addWaterLog: async (id, body) => {
    set({ loading: true, error: null });
    try {
      const updated = await apiAddWaterLog(id, body);
      set((state) => ({
        gardenList: state.gardenList.map((g) => (g.id === id ? updated : g)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  harvestGarden: async (id) => {
    set({ loading: true, error: null });
    try {
      const updated = await apiHarvestGarden(id);
      set((state) => ({
        gardenList: state.gardenList.map((g) => (g.id === id ? updated : g)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
