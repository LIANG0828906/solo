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
  lastWaterAt: number;
  lastFertilizeAt: number;
  lastRepotAt: number;
}

export interface PlantWithStats extends Plant {
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

export const CARE_TYPE_TO_FIELD: Record<CareType, 'lastWaterAt' | 'lastFertilizeAt' | 'lastRepotAt'> = {
  water: 'lastWaterAt',
  fertilize: 'lastFertilizeAt',
  repot: 'lastRepotAt',
};

export interface PaginatedResult<T> {
  items: T[];
  cursor: number | null;
  hasMore: boolean;
}

const DB_NAME = 'plant-care-db';
const DB_VERSION = 2;
const STORE_PLANTS = 'plants';
const STORE_RECORDS = 'records';

interface PlantDB {
  plants: {
    key: string;
    value: Plant;
    indexes: {
      'by-createdAt': number;
      'by-lastWaterAt': number;
    };
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
      upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_PLANTS)) {
            const plantStore = db.createObjectStore(STORE_PLANTS, { keyPath: 'id' });
            plantStore.createIndex('by-createdAt', 'createdAt');
            plantStore.createIndex('by-lastWaterAt', 'lastWaterAt');
          }
          if (!db.objectStoreNames.contains(STORE_RECORDS)) {
            const recordStore = db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
            recordStore.createIndex('by-plantId', 'plantId');
            recordStore.createIndex('by-plantId-timestamp', ['plantId', 'timestamp']);
            recordStore.createIndex('by-timestamp', 'timestamp');
          }
        }
        if (oldVersion >= 1 && oldVersion < 2) {
          const plantStore = tx.objectStore(STORE_PLANTS);
          if (!plantStore.indexNames.contains('by-lastWaterAt')) {
            plantStore.createIndex('by-lastWaterAt', 'lastWaterAt');
          }
        }
      },
    });
  }
  return dbPromise;
}

export function computeDaysSince(timestamp: number, now: number = Date.now()): number | null {
  if (timestamp === 0) return null;
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

export async function fetchPlantsPaginated(
  pageSize: number,
  cursor?: number | null,
): Promise<PaginatedResult<Plant>> {
  const db = await getDB();
  const tx = db.transaction(STORE_PLANTS, 'readonly');
  const index = tx.store.index('by-lastWaterAt');

  const items: Plant[] = [];
  let hasMore = false;
  let lastKey: number | null = null;

  let cursorSource = await index.openCursor(
    cursor != null ? IDBKeyRange.lowerBound(cursor, true) : undefined,
    'next',
  );

  while (cursorSource) {
    items.push(cursorSource.value);
    lastKey = cursorSource.value.lastWaterAt;
    if (items.length >= pageSize) {
      const next = await cursorSource.continue();
      hasMore = !!next;
      break;
    }
    cursorSource = await cursorSource.continue();
  }

  return {
    items,
    cursor: hasMore ? lastKey : null,
    hasMore,
  };
}

export async function addPlant(
  data: Omit<Plant, 'id' | 'createdAt' | 'lastWaterAt' | 'lastFertilizeAt' | 'lastRepotAt'>,
): Promise<Plant> {
  const db = await getDB();
  const plant: Plant = {
    ...data,
    id: uuidv4(),
    createdAt: Date.now(),
    lastWaterAt: 0,
    lastFertilizeAt: 0,
    lastRepotAt: 0,
  };
  await db.add(STORE_PLANTS, plant);
  return plant;
}

export async function updatePlant(plant: Plant): Promise<void> {
  const db = await getDB();
  await db.put(STORE_PLANTS, plant);
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
  return db.getAllFromIndex(
    STORE_RECORDS,
    'by-plantId-timestamp',
    IDBKeyRange.bound([plantId, -Infinity], [plantId, Infinity]),
  );
}

async function recomputeLastCareDate(plantId: string, careType: CareType): Promise<number> {
  const db = await getDB();
  const allRecords = await db.getAllFromIndex(
    STORE_RECORDS,
    'by-plantId-timestamp',
    IDBKeyRange.bound([plantId, -Infinity], [plantId, Infinity]),
  );
  let latest = 0;
  for (const r of allRecords) {
    if (r.type === careType && r.timestamp > latest) {
      latest = r.timestamp;
    }
  }
  return latest;
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

  const plant = await db.get(STORE_PLANTS, record.plantId);
  if (plant) {
    const field = CARE_TYPE_TO_FIELD[record.type];
    if (record.timestamp > plant[field]) {
      plant[field] = record.timestamp;
      await db.put(STORE_PLANTS, plant);
    }
  }

  return record;
}

export async function updateCareRecord(record: CareRecord): Promise<void> {
  const db = await getDB();
  await db.put(STORE_RECORDS, record);

  const plant = await db.get(STORE_PLANTS, record.plantId);
  if (plant) {
    plant.lastWaterAt = await recomputeLastCareDate(record.plantId, 'water');
    plant.lastFertilizeAt = await recomputeLastCareDate(record.plantId, 'fertilize');
    plant.lastRepotAt = await recomputeLastCareDate(record.plantId, 'repot');
    await db.put(STORE_PLANTS, plant);
  }
}

export async function deleteCareRecord(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE_RECORDS, id);
  if (!record) return;

  await db.delete(STORE_RECORDS, id);

  const plant = await db.get(STORE_PLANTS, record.plantId);
  if (plant) {
    plant.lastWaterAt = await recomputeLastCareDate(record.plantId, 'water');
    plant.lastFertilizeAt = await recomputeLastCareDate(record.plantId, 'fertilize');
    plant.lastRepotAt = await recomputeLastCareDate(record.plantId, 'repot');
    await db.put(STORE_PLANTS, plant);
  }
}

export function enrichPlantsWithStats(
  plants: Plant[],
  now: number = Date.now(),
): PlantWithStats[] {
  return plants.map((plant) => {
    const daysSinceLastWater = computeDaysSince(plant.lastWaterAt, now);
    const daysSinceLastFertilize = computeDaysSince(plant.lastFertilizeAt, now);
    const daysSinceLastRepot = computeDaysSince(plant.lastRepotAt, now);

    return {
      ...plant,
      daysSinceLastWater,
      daysSinceLastFertilize,
      daysSinceLastRepot,
      needsWaterWarning: isCareOverdue(daysSinceLastWater, CARE_THRESHOLDS.water),
    };
  });
}

export function sortPlantsByCareUrgency(plants: PlantWithStats[]): PlantWithStats[] {
  return [...plants].sort((a, b) => {
    const aHasRecord = a.lastWaterAt > 0;
    const bHasRecord = b.lastWaterAt > 0;
    if (!aHasRecord && !bHasRecord) return b.createdAt - a.createdAt;
    if (!aHasRecord) return -1;
    if (!bHasRecord) return 1;
    const aDays = a.daysSinceLastWater ?? 0;
    const bDays = b.daysSinceLastWater ?? 0;
    return bDays - aDays;
  });
}

interface PlantsState {
  plants: PlantWithStats[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  loadPlants: () => Promise<void>;
  loadPlantsPaginated: (pageSize: number, cursor?: number | null) => Promise<PaginatedResult<PlantWithStats>>;
  addPlant: (data: Omit<Plant, 'id' | 'createdAt' | 'lastWaterAt' | 'lastFertilizeAt' | 'lastRepotAt'>) => Promise<Plant>;
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
      const enriched = enrichPlantsWithStats(plants);
      const sorted = sortPlantsByCareUrgency(enriched);
      set({ plants: sorted, loading: false, hydrated: true });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  async loadPlantsPaginated(pageSize, cursor) {
    const result = await fetchPlantsPaginated(pageSize, cursor);
    const enriched = enrichPlantsWithStats(result.items);
    return {
      items: sortPlantsByCareUrgency(enriched),
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
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
    const enriched = enrichPlantsWithStats(plants);
    const sorted = sortPlantsByCareUrgency(enriched);
    set({ plants: sorted });
  },
}));
