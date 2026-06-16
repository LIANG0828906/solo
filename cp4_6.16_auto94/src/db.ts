import { openDB, IDBPDatabase } from 'idb';
import type { Capsule } from './types';

const DB_NAME = 'time-capsule-db';
const DB_VERSION = 1;
const STORE_NAME = 'capsules';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('openDate', 'openDate');
          store.createIndex('status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllCapsules(): Promise<Capsule[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function getCapsule(id: string): Promise<Capsule | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function addCapsule(capsule: Capsule): Promise<void> {
  const db = await getDB();
  await db.add(STORE_NAME, capsule);
}

export async function updateCapsule(id: string, updates: Partial<Capsule>): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, id);
  if (existing) {
    await db.put(STORE_NAME, { ...existing, ...updates });
  }
}

export async function deleteCapsule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
