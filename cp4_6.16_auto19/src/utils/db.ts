import { createStore, get, set, del, values, keys } from 'idb-keyval';
import type { Boardgame, Activity, Player, ActivityPlayer } from '@/types';

const DB_NAME = 'boardgame-app-db';

const stores = {
  boardgames: createStore(DB_NAME, 'boardgames'),
  activities: createStore(DB_NAME, 'activities'),
  players: createStore(DB_NAME, 'players'),
  activityPlayers: createStore(DB_NAME, 'activityPlayers'),
};

export type StoreName = keyof typeof stores;

export const STORES = {
  BOARDGAMES: 'boardgames' as StoreName,
  ACTIVITIES: 'activities' as StoreName,
  PLAYERS: 'players' as StoreName,
  ACTIVITY_PLAYERS: 'activityPlayers' as StoreName,
};

function getStore(name: StoreName) {
  return stores[name];
}

export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const store = getStore(storeName);
  try {
    const result = await values<T>(store);
    return result || [];
  } catch {
    return [];
  }
}

export async function getFromStore<T>(
  storeName: StoreName,
  key: string
): Promise<T | undefined> {
  const store = getStore(storeName);
  try {
    const result = await get<T>(key, store);
    return result;
  } catch {
    return undefined;
  }
}

export async function putToStore(
  storeName: StoreName,
  value: { id: string }
): Promise<void> {
  const store = getStore(storeName);
  await set(value.id, value, store);
}

export async function deleteFromStore(
  storeName: StoreName,
  key: string
): Promise<void> {
  const store = getStore(storeName);
  await del(key, store);
}

export async function getFromIndex<T>(
  storeName: StoreName,
  indexKey: keyof T,
  value: string
): Promise<T[]> {
  const all = await getAllFromStore<T>(storeName);
  return all.filter((item) => (item as Record<string, unknown>)[indexKey as string] === value);
}

export async function getAllKeys(storeName: StoreName): Promise<string[]> {
  const store = getStore(storeName);
  try {
    const result = await keys<string>(store);
    return result || [];
  } catch {
    return [];
  }
}

export { Boardgame, Activity, Player, ActivityPlayer };
