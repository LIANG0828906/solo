import { openDB, type IDBPDatabase } from 'idb';
import type { Work } from '@/types';

const DB_NAME = 'ArtVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'works';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveAll(works: Work[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  await store.clear();
  for (const work of works) {
    await store.put(work);
  }
  await tx.done;
}

export async function loadAll(): Promise<Work[]> {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);
    return all as Work[];
  } catch {
    return [];
  }
}
