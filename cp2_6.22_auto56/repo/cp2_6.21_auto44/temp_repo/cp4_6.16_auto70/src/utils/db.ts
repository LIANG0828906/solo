import { createStore, get, set, del, keys, entries } from 'idb-keyval';
import type { Plant, CareLog } from '@/types';

const plantsStore = createStore('plant-diary-plants', 'plants');
const logsStore = createStore('plant-diary-logs', 'logs');

const PLANTS_PREFIX = 'plant:';
const LOGS_PREFIX = 'log:';

export async function getPlants(): Promise<Plant[]> {
  try {
    const allKeys = await keys(plantsStore);
    const plantKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(PLANTS_PREFIX)
    ) as string[];
    const result: Plant[] = [];
    for (const key of plantKeys) {
      const plant = await get<Plant>(key, plantsStore);
      if (plant) result.push(plant);
    }
    return result.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Failed to get plants from IndexedDB:', error);
    return [];
  }
}

export async function setPlant(plant: Plant): Promise<void> {
  try {
    await set(`${PLANTS_PREFIX}${plant.id}`, plant, plantsStore);
  } catch (error) {
    console.error('Failed to save plant to IndexedDB:', error);
    throw error;
  }
}

export async function deletePlant(id: string): Promise<void> {
  try {
    await del(`${PLANTS_PREFIX}${id}`, plantsStore);
    const allLogs = await getCareLogs();
    const relatedLogs = allLogs.filter((l) => l.plantId === id);
    for (const log of relatedLogs) {
      await del(`${LOGS_PREFIX}${log.id}`, logsStore);
    }
  } catch (error) {
    console.error('Failed to delete plant from IndexedDB:', error);
    throw error;
  }
}

export async function getCareLogs(): Promise<CareLog[]> {
  try {
    const allKeys = await keys(logsStore);
    const logKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(LOGS_PREFIX)
    ) as string[];
    const result: CareLog[] = [];
    for (const key of logKeys) {
      const log = await get<CareLog>(key, logsStore);
      if (log) result.push(log);
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to get care logs from IndexedDB:', error);
    return [];
  }
}

export async function setCareLog(log: CareLog): Promise<void> {
  try {
    await set(`${LOGS_PREFIX}${log.id}`, log, logsStore);
  } catch (error) {
    console.error('Failed to save care log to IndexedDB:', error);
    throw error;
  }
}

export async function deleteCareLog(id: string): Promise<void> {
  try {
    await del(`${LOGS_PREFIX}${id}`, logsStore);
  } catch (error) {
    console.error('Failed to delete care log from IndexedDB:', error);
    throw error;
  }
}

export async function getAllData(): Promise<{ plants: Plant[]; careLogs: CareLog[] }> {
  const [plants, careLogs] = await Promise.all([getPlants(), getCareLogs()]);
  return { plants, careLogs };
}
