import { create } from 'zustand';
import { get, set, del, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, PlantRecord } from './types';

const PLANTS_KEY = 'herbarium_plants';
const RECORDS_PREFIX = 'herbarium_records_';

interface PlantStore {
  plants: Plant[];
  records: Record<string, PlantRecord[]>;
  isLoaded: boolean;
  loadData: () => Promise<void>;
  addPlant: (data: Omit<Plant, 'id' | 'createdAt'>) => Promise<Plant>;
  updatePlant: (id: string, data: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  addRecord: (plantId: string, data: Omit<PlantRecord, 'id' | 'plantId' | 'date'> & { date?: number }) => Promise<PlantRecord>;
  deleteRecord: (plantId: string, recordId: string) => Promise<void>;
  getRecordsByPlantId: (plantId: string) => PlantRecord[];
}

const recordsKey = (plantId: string) => `${RECORDS_PREFIX}${plantId}`;

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  records: {},
  isLoaded: false,

  loadData: async () => {
    try {
      const plants = await get<Plant[]>(PLANTS_KEY) || [];
      const allKeys = await keys();
      const recordKeys = allKeys.filter(k => String(k).startsWith(RECORDS_PREFIX));
      const recordsMap: Record<string, PlantRecord[]> = {};

      for (const key of recordKeys) {
        const plantId = String(key).slice(RECORDS_PREFIX.length);
        const plantRecords = await get<PlantRecord[]>(key) || [];
        recordsMap[plantId] = plantRecords;
      }

      set({ plants, records: recordsMap, isLoaded: true });
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
      set({ isLoaded: true });
    }
  },

  addPlant: async (data) => {
    const plant: Plant = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const plants = [...get().plants, plant];
    set({ plants });
    await set(PLANTS_KEY, plants);
    return plant;
  },

  updatePlant: async (id, data) => {
    const plants = get().plants.map(p => (p.id === id ? { ...p, ...data } : p));
    set({ plants });
    await set(PLANTS_KEY, plants);
  },

  deletePlant: async (id) => {
    const plants = get().plants.filter(p => p.id !== id);
    const records = { ...get().records };
    delete records[id];
    set({ plants, records });
    await set(PLANTS_KEY, plants);
    await del(recordsKey(id));
  },

  addRecord: async (plantId, data) => {
    const record: PlantRecord = {
      ...data,
      id: uuidv4(),
      plantId,
      date: data.date ?? Date.now(),
    };
    const plantRecords = [...(get().records[plantId] || []), record];
    const records = { ...get().records, [plantId]: plantRecords };
    set({ records });
    await set(recordsKey(plantId), plantRecords);
    return record;
  },

  deleteRecord: async (plantId, recordId) => {
    const plantRecords = (get().records[plantId] || []).filter(r => r.id !== recordId);
    const records = { ...get().records, [plantId]: plantRecords };
    set({ records });
    await set(recordsKey(plantId), plantRecords);
  },

  getRecordsByPlantId: (plantId) => {
    return get().records[plantId] || [];
  },
}));
