import { openDB, IDBPDatabase } from 'idb';
import type { Exhibit } from '../types';

const DB_NAME = 'ExhibitionHubDB';
const DB_VERSION = 1;
const STORE_EXHIBITS = 'exhibits';

let dbPromise: Promise<IDBPDatabase> | null = null;

function initDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_EXHIBITS)) {
        const store = db.createObjectStore(STORE_EXHIBITS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });

  return dbPromise;
}

export async function getAllExhibits(): Promise<Exhibit[]> {
  const db = await initDB();
  const exhibits = await db.getAllFromIndex(STORE_EXHIBITS, 'createdAt');
  return exhibits.reverse();
}

export async function addExhibit(exhibit: Exhibit): Promise<void> {
  const db = await initDB();
  await db.add(STORE_EXHIBITS, exhibit);
}

export async function updateExhibit(exhibit: Exhibit): Promise<void> {
  const db = await initDB();
  await db.put(STORE_EXHIBITS, exhibit);
}

export async function deleteExhibit(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_EXHIBITS, id);
}

export async function seedSampleData(exhibits: Exhibit[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_EXHIBITS, 'readwrite');
  await Promise.all(exhibits.map((e) => tx.store.add(e)));
  await tx.done;
}
