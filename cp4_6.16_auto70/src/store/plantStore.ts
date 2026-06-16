import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, CareLog, CareType } from '@/types';
import {
  getPlants,
  setPlant,
  deletePlant as dbDeletePlant,
  getCareLogs,
  setCareLog,
  deleteCareLog as dbDeleteCareLog,
  getAllData,
} from '@/utils/db';

interface PlantStore {
  plants: Plant[];
  careLogs: CareLog[];
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  addCareLog: (log: Omit<CareLog, 'id' | 'createdAt'>) => Promise<void>;
  deleteCareLog: (id: string) => Promise<void>;
  getCareLogsByPlant: (plantId: string) => CareLog[];
  getCareLogsByDate: (date: string) => CareLog[];
  getPlantById: (id: string) => Plant | undefined;
  getLastCareDate: (plantId: string) => string | null;
}

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  careLogs: [],
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      const { plants, careLogs } = await getAllData();
      set({ plants, careLogs, initialized: true });
    } catch (error) {
      console.error('Failed to initialize store:', error);
    } finally {
      set({ loading: false });
    }
  },

  addPlant: async (plantData) => {
    const now = new Date().toISOString();
    const newPlant: Plant = {
      ...plantData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await setPlant(newPlant);
    set((state) => ({
      plants: [newPlant, ...state.plants],
    }));
  },

  updatePlant: async (id, updates) => {
    const state = get();
    const plant = state.plants.find((p) => p.id === id);
    if (!plant) return;
    const updated: Plant = {
      ...plant,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setPlant(updated);
    set((s) => ({
      plants: s.plants.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deletePlant: async (id) => {
    await dbDeletePlant(id);
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== id),
      careLogs: state.careLogs.filter((l) => l.plantId !== id),
    }));
  },

  addCareLog: async (logData) => {
    const now = new Date().toISOString();
    const newLog: CareLog = {
      ...logData,
      id: uuidv4(),
      createdAt: now,
    };
    await setCareLog(newLog);
    await setPlant({
      ...get().getPlantById(logData.plantId)!,
      updatedAt: now,
    });
    set((state) => ({
      careLogs: [newLog, ...state.careLogs],
      plants: state.plants
        .map((p) => (p.id === logData.plantId ? { ...p, updatedAt: now } : p))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    }));
  },

  deleteCareLog: async (id) => {
    await dbDeleteCareLog(id);
    set((state) => ({
      careLogs: state.careLogs.filter((l) => l.id !== id),
    }));
  },

  getCareLogsByPlant: (plantId) => {
    return get()
      .careLogs.filter((l) => l.plantId === plantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getCareLogsByDate: (date) => {
    return get().careLogs.filter((l) => {
      const logDate = new Date(l.date).toISOString().split('T')[0];
      return logDate === date;
    });
  },

  getPlantById: (id) => {
    return get().plants.find((p) => p.id === id);
  },

  getLastCareDate: (plantId) => {
    const logs = get().careLogs.filter((l) => l.plantId === plantId);
    if (logs.length === 0) return null;
    const sorted = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0].date;
  },
}));
