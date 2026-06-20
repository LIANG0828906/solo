import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { GardenZone, PlantStatus, Plant, ZoneType, WateringLog, GardenState } from '../types';
import { localStorageAdapter } from '../persistence/localStorageAdapter';

const STORAGE_KEY = 'garden-state';

interface GardenStore extends GardenState {
  addZone: (name: string, type: ZoneType) => void;
  updateZone: (id: string, updates: Partial<GardenZone>) => void;
  deleteZone: (id: string) => void;
  updateStatus: (id: string, status: PlantStatus) => void;
  getZoneById: (id: string) => GardenZone | undefined;
  addPlant: (zoneId: string, plantName: string) => void;
  removePlant: (zoneId: string, plantId: string) => void;
  addWateringLog: (zoneId: string) => void;
  getWateringLogsByZone: (zoneId: string) => WateringLog[];
  getWeeklyWateringLogs: (zoneId: string) => WateringLog[];
  calculateWeeklyCompletionRate: (zoneId: string) => number;
  loadFromStorage: () => void;
  persist: () => void;
}

const getInitialState = (): GardenState => {
  const stored = localStorageAdapter.get<GardenState | null>(STORAGE_KEY, null);
  if (stored) {
    return stored;
  }
  
  const now = Date.now();
  return {
    zones: [
      {
        id: uuidv4(),
        name: '西红柿菜畦',
        type: 'vegetable',
        status: 'healthy',
        plants: [
          { id: uuidv4(), name: '番茄' },
          { id: uuidv4(), name: '黄瓜' },
        ],
        createdAt: now,
      },
      {
        id: uuidv4(),
        name: '春日花坛',
        type: 'flower',
        status: 'thirsty',
        plants: [
          { id: uuidv4(), name: '月季' },
          { id: uuidv4(), name: '郁金香' },
        ],
        createdAt: now,
      },
      {
        id: uuidv4(),
        name: '苹果园',
        type: 'fruit',
        status: 'pest',
        plants: [
          { id: uuidv4(), name: '苹果树' },
          { id: uuidv4(), name: '梨树' },
        ],
        createdAt: now,
      },
    ],
    wateringLogs: [],
  };
};

export const useGardenStore = create<GardenStore>((set, get) => ({
  ...getInitialState(),

  addZone: (name: string, type: ZoneType) => {
    const newZone: GardenZone = {
      id: uuidv4(),
      name,
      type,
      status: 'healthy',
      plants: [],
      createdAt: Date.now(),
    };
    set((state) => ({
      zones: [...state.zones, newZone],
    }));
    get().persist();
  },

  updateZone: (id: string, updates: Partial<GardenZone>) => {
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === id ? { ...zone, ...updates } : zone
      ),
    }));
    get().persist();
  },

  deleteZone: (id: string) => {
    set((state) => ({
      zones: state.zones.filter((zone) => zone.id !== id),
      wateringLogs: state.wateringLogs.filter((log) => log.zoneId !== id),
    }));
    get().persist();
  },

  updateStatus: (id: string, status: PlantStatus) => {
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === id ? { ...zone, status } : zone
      ),
    }));
    get().persist();
  },

  getZoneById: (id: string) => {
    return get().zones.find((zone) => zone.id === id);
  },

  addPlant: (zoneId: string, plantName: string) => {
    const newPlant: Plant = {
      id: uuidv4(),
      name: plantName,
    };
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === zoneId
          ? { ...zone, plants: [...zone.plants, newPlant] }
          : zone
      ),
    }));
    get().persist();
  },

  removePlant: (zoneId: string, plantId: string) => {
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === zoneId
          ? { ...zone, plants: zone.plants.filter((p) => p.id !== plantId) }
          : zone
      ),
    }));
    get().persist();
  },

  addWateringLog: (zoneId: string) => {
    const newLog: WateringLog = {
      id: uuidv4(),
      zoneId,
      timestamp: Date.now(),
    };
    set((state) => ({
      wateringLogs: [...state.wateringLogs, newLog],
    }));
    get().persist();
  },

  getWateringLogsByZone: (zoneId: string) => {
    return get().wateringLogs.filter((log) => log.zoneId === zoneId);
  },

  getWeeklyWateringLogs: (zoneId: string) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return get()
      .wateringLogs.filter(
        (log) => log.zoneId === zoneId && log.timestamp >= oneWeekAgo
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  calculateWeeklyCompletionRate: (zoneId: string) => {
    const logs = get().getWeeklyWateringLogs(zoneId);
    const daysWithWater = new Set(
      logs.map((log) => new Date(log.timestamp).toDateString())
    ).size;
    return Math.min(daysWithWater / 7, 1);
  },

  loadFromStorage: () => {
    const stored = localStorageAdapter.get<GardenState | null>(STORAGE_KEY, null);
    if (stored) {
      set(stored);
    }
  },

  persist: () => {
    const state = get();
    localStorageAdapter.set<GardenState>(STORAGE_KEY, {
      zones: state.zones,
      wateringLogs: state.wateringLogs,
    });
  },
}));
