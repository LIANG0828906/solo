import { create } from 'zustand';
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays } from 'date-fns';

export type CareType = 'water' | 'fertilize' | 'repot';

export interface CareRecord {
  id: string;
  plantId: string;
  type: CareType;
  timestamp: number;
  note?: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  purchaseDate: number;
  photo: string;
  createdAt: number;
}

export interface PlantWithStats extends Plant {
  lastWaterAt: number | null;
  lastFertilizeAt: number | null;
  lastRepotAt: number | null;
  daysSinceLastWater: number | null;
  daysSinceLastFertilize: number | null;
  daysSinceLastRepot: number | null;
  needsWaterWarning: boolean;
}

export const CARE_THRESHOLDS: Record<CareType, number> = {
  water: 7,
  fertilize: 30,
  repot: 365,
};

const DB_NAME = 'plant-care-db';
const DB_VERSION = 1;
const STORE_PLANTS = 'plants';
const STORE_RECORDS = 'records';

interface PlantDB {
  plants: {
    key: string;
    value: Plant;
    indexes: { 'by-createdAt': number };
  };
  records: {
    key: string;
    value: CareRecord;
    indexes: {
      'by-plantId': string;
      'by-plantId-timestamp': [string, number];
      'by-timestamp': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<PlantDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PlantDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PlantDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_PLANTS)) {
          const plantStore = db.createObjectStore(STORE_PLANTS, { keyPath: 'id' });
          plantStore.createIndex('by-createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          const recordStore = db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
          recordStore.createIndex('by-plantId', 'plantId');
          recordStore.createIndex('by-plantId-timestamp', ['plantId', 'timestamp']);
          recordStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export function computeDaysSince(timestamp: number | null, now: number = Date.now()): number | null {
  if (timestamp === null) return null;
  return differenceInDays(now, timestamp);
}

export function isCareOverdue(daysSince: number | null, threshold: number): boolean {
  if (daysSince === null) return false;
  return daysSince > threshold;
}

export async function fetchAllPlants(): Promise<Plant[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_PLANTS, 'by-createdAt');
}

export async function fetchPlantById(id: string): Promise<Plant | undefined> {
  const db = await getDB();
  return db.get(STORE_PLANTS, id);
}

export async function addPlant(
  data: Omit<Plant, 'id' | 'createdAt'>,
): Promise<Plant> {
  const db = await getDB();
  const plant: Plant = {
    ...data,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  await db.add(STORE_PLANTS, plant);
  return plant;
}

export async function deletePlant(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORE_PLANTS, STORE_RECORDS], 'readwrite');
  await tx.objectStore(STORE_PLANTS).delete(id);
  const records = await tx.objectStore(STORE_RECORDS).index('by-plantId').getAll(id);
  for (const record of records) {
    await tx.objectStore(STORE_RECORDS).delete(record.id);
  }
  await tx.done;
}

export async function fetchRecordsByPlantId(plantId: string): Promise<CareRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_RECORDS, 'by-plantId-timestamp', IDBKeyRange.bound(
    [plantId, -Infinity],
    [plantId, Infinity],
  ));
}

export async function fetchLatestRecordsByType(
  plantIds: string[],
): Promise<Map<string, Map<CareType, CareRecord>>> {
  const db = await getDB();
  const result = new Map<string, Map<CareType, CareRecord>>();

  for (const plantId of plantIds) {
    const records = await db.getAllFromIndex(
      STORE_RECORDS,
      'by-plantId-timestamp',
      IDBKeyRange.bound([plantId, -Infinity], [plantId, Infinity]),
    );
    const typeMap = new Map<CareType, CareRecord>();
    for (const record of records) {
      const existing = typeMap.get(record.type);
      if (!existing || record.timestamp > existing.timestamp) {
        typeMap.set(record.type, record);
      }
    }
    result.set(plantId, typeMap);
  }
  return result;
}

export async function addCareRecord(
  data: Omit<CareRecord, 'id' | 'timestamp'> & { timestamp?: number },
): Promise<CareRecord> {
  const db = await getDB();
  const record: CareRecord = {
    ...data,
    id: uuidv4(),
    timestamp: data.timestamp ?? Date.now(),
  };
  await db.add(STORE_RECORDS, record);
  return record;
}

export async function updateCareRecord(record: CareRecord): Promise<void> {
  const db = await getDB();
  await db.put(STORE_RECORDS, record);
}

export async function deleteCareRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_RECORDS, id);
}

export function enrichPlantsWithStats(
  plants: Plant[],
  latestRecords: Map<string, Map<CareType, CareRecord>>,
  now: number = Date.now(),
): PlantWithStats[] {
  return plants.map((plant) => {
    const typeMap = latestRecords.get(plant.id) ?? new Map();
    const lastWater = typeMap.get('water') ?? null;
    const lastFertilize = typeMap.get('fertilize') ?? null;
    const lastRepot = typeMap.get('repot') ?? null;

    const lastWaterAt = lastWater?.timestamp ?? null;
    const lastFertilizeAt = lastFertilize?.timestamp ?? null;
    const lastRepotAt = lastRepot?.timestamp ?? null;

    const daysSinceLastWater = computeDaysSince(lastWaterAt, now);
    const daysSinceLastFertilize = computeDaysSince(lastFertilizeAt, now);
    const daysSinceLastRepot = computeDaysSince(lastRepotAt, now);

    return {
      ...plant,
      lastWaterAt,
      lastFertilizeAt,
      lastRepotAt,
      daysSinceLastWater,
      daysSinceLastFertilize,
      daysSinceLastRepot,
      needsWaterWarning: isCareOverdue(daysSinceLastWater, CARE_THRESHOLDS.water),
    };
  });
}

export function sortPlantsByCareUrgency(plants: PlantWithStats[]): PlantWithStats[] {
  return [...plants].sort((a, b) => {
    const aDays = a.daysSinceLastWater ?? -1;
    const bDays = b.daysSinceLastWater ?? -1;
    if (aDays === -1 && bDays === -1) return b.createdAt - a.createdAt;
    if (aDays === -1) return 1;
    if (bDays === -1) return -1;
    return bDays - aDays;
  });
}

interface PlantsState {
  plants: PlantWithStats[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  loadPlants: () => Promise<void>;
  addPlant: (data: Omit<Plant, 'id' | 'createdAt'>) => Promise<Plant>;
  addCareRecord: (
    data: Omit<CareRecord, 'id' | 'timestamp'> & { timestamp?: number },
  ) => Promise<CareRecord>;
  updateCareRecord: (record: CareRecord) => Promise<void>;
  deleteCareRecord: (id: string) => Promise<void>;
  removePlant: (id: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const usePlantsStore = create<PlantsState>((set, get) => ({
  plants: [],
  loading: false,
  error: null,
  hydrated: false,

  async loadPlants() {
    set({ loading: true, error: null });
    try {
      const plants = await fetchAllPlants();
      const plantIds = plants.map((p) => p.id);
      const latestRecords = await fetchLatestRecordsByType(plantIds);
      const enriched = enrichPlantsWithStats(plants, latestRecords);
      const sorted = sortPlantsByCareUrgency(enriched);
      set({ plants: sorted, loading: false, hydrated: true });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  async addPlant(data) {
    const plant = await addPlant(data);
    await get().refreshStats();
    return plant;
  },

  async addCareRecord(data) {
    const record = await addCareRecord(data);
    await get().refreshStats();
    return record;
  },

  async updateCareRecord(record) {
    await updateCareRecord(record);
    await get().refreshStats();
  },

  async deleteCareRecord(id) {
    await deleteCareRecord(id);
    await get().refreshStats();
  },

  async removePlant(id) {
    await deletePlant(id);
    await get().refreshStats();
  },

  async refreshStats() {
    const plants = await fetchAllPlants();
    const plantIds = plants.map((p) => p.id);
    const latestRecords = await fetchLatestRecordsByType(plantIds);
    const enriched = enrichPlantsWithStats(plants, latestRecords);
    const sorted = sortPlantsByCareUrgency(enriched);
    set({ plants: sorted });
  },
}));
