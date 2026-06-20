import { create } from 'zustand';
import { get, set, del, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, CareRecord, GrowthRecord, PlantStatus } from './types';

const DB_KEYS = {
  plants: 'plants',
  careRecords: 'careRecords',
  growthRecords: 'growthRecords',
} as const;

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function calculatePlantStatus(plant: Plant): PlantStatus {
  const today = getToday();
  const daysSinceWatered = daysBetween(plant.lastWateredDate, today);
  const daysSinceFertilized = daysBetween(plant.lastFertilizedDate, today);
  if (daysSinceWatered >= plant.wateringIntervalDays) return '缺水';
  if (daysSinceFertilized >= plant.fertilizingIntervalDays) return '缺肥';
  return '健康';
}

interface PlantState {
  plants: Plant[];
  careRecords: CareRecord[];
  growthRecords: GrowthRecord[];
  searchQuery: string;
  filterStatus: PlantStatus | '全部';
}

interface PlantActions {
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'status'>) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  addCareRecord: (record: Omit<CareRecord, 'id'>) => void;
  updatePlantCareDate: (plantId: string, careType: '浇水' | '施肥') => void;
  addGrowthRecord: (record: Omit<GrowthRecord, 'id'>) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: PlantStatus | '全部') => void;
  getFilteredPlants: () => Plant[];
  getTodayCarePlants: () => Plant[];
  getCompletedTodayCare: () => Plant[];
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

type PlantStore = PlantState & PlantActions;

let isLoading = false;

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  careRecords: [],
  growthRecords: [],
  searchQuery: '',
  filterStatus: '全部',

  addPlant: (plantData) => {
    const newPlant: Plant = {
      ...plantData,
      id: uuidv4(),
      createdAt: getToday(),
      status: '健康',
    };
    newPlant.status = calculatePlantStatus(newPlant);
    set((state) => ({ plants: [...state.plants, newPlant] }));
  },

  updatePlant: (id, updates) => {
    set((state) => ({
      plants: state.plants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deletePlant: (id) => {
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== id),
      careRecords: state.careRecords.filter((r) => r.plantId !== id),
      growthRecords: state.growthRecords.filter((r) => r.plantId !== id),
    }));
  },

  addCareRecord: (recordData) => {
    const newRecord: CareRecord = {
      ...recordData,
      id: uuidv4(),
    };
    set((state) => ({
      careRecords: [...state.careRecords, newRecord],
    }));
  },

  updatePlantCareDate: (plantId, careType) => {
    const today = getToday();
    set((state) => ({
      plants: state.plants.map((p) => {
        if (p.id !== plantId) return p;
        const updated =
          careType === '浇水'
            ? { ...p, lastWateredDate: today }
            : { ...p, lastFertilizedDate: today };
        return { ...updated, status: calculatePlantStatus(updated as Plant) };
      }),
    }));
  },

  addGrowthRecord: (recordData) => {
    const newRecord: GrowthRecord = {
      ...recordData,
      id: uuidv4(),
    };
    set((state) => ({
      growthRecords: [...state.growthRecords, newRecord],
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  getFilteredPlants: () => {
    const { plants, searchQuery, filterStatus } = get();
    return plants.filter((p) => {
      const currentStatus = calculatePlantStatus(p);
      const matchesSearch =
        !searchQuery ||
        p.name.includes(searchQuery) ||
        p.plantType.includes(searchQuery);
      const matchesStatus =
        filterStatus === '全部' || currentStatus === filterStatus;
      return matchesSearch && matchesStatus;
    });
  },

  getTodayCarePlants: () => {
    const { plants } = get();
    const today = getToday();
    return plants.filter((p) => {
      const daysSinceWatered = daysBetween(p.lastWateredDate, today);
      const daysSinceFertilized = daysBetween(p.lastFertilizedDate, today);
      return (
        daysSinceWatered >= p.wateringIntervalDays ||
        daysSinceFertilized >= p.fertilizingIntervalDays
      );
    });
  },

  getCompletedTodayCare: () => {
    const todayCarePlants = get().getTodayCarePlants();
    const { careRecords } = get();
    const today = getToday();
    return todayCarePlants.filter((p) => {
      const daysSinceWatered = daysBetween(p.lastWateredDate, today);
      const daysSinceFertilized = daysBetween(p.lastFertilizedDate, today);
      const needsWatering = daysSinceWatered >= p.wateringIntervalDays;
      const needsFertilizing = daysSinceFertilized >= p.fertilizingIntervalDays;
      const todayRecords = careRecords.filter(
        (r) => r.plantId === p.id && r.date === today
      );
      if (needsWatering && needsFertilizing) {
        return (
          todayRecords.some((r) => r.type === '浇水') &&
          todayRecords.some((r) => r.type === '施肥')
        );
      }
      if (needsWatering) {
        return todayRecords.some((r) => r.type === '浇水');
      }
      if (needsFertilizing) {
        return todayRecords.some((r) => r.type === '施肥');
      }
      return false;
    });
  },

  loadFromDB: async () => {
    isLoading = true;
    try {
      const allKeys = await keys();
      const [plants, careRecords, growthRecords] = await Promise.all([
        get<Plant[]>(DB_KEYS.plants),
        get<CareRecord[]>(DB_KEYS.careRecords),
        get<GrowthRecord[]>(DB_KEYS.growthRecords),
      ]);
      set({
        plants: plants ?? [],
        careRecords: careRecords ?? [],
        growthRecords: growthRecords ?? [],
      });
      const usedKeys = new Set(Object.values(DB_KEYS));
      for (const key of allKeys as string[]) {
        if (!usedKeys.has(key)) {
          await del(key);
        }
      }
    } finally {
      isLoading = false;
    }
  },

  saveToDB: async () => {
    const { plants, careRecords, growthRecords } = get();
    await Promise.all([
      set(DB_KEYS.plants, plants),
      set(DB_KEYS.careRecords, careRecords),
      set(DB_KEYS.growthRecords, growthRecords),
    ]);
  },
}));

usePlantStore.subscribe(() => {
  if (!isLoading) {
    usePlantStore.getState().saveToDB();
  }
});
