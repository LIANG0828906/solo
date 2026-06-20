import { openDB, type IDBPDatabase } from 'idb';
import type { Subscription } from '@/types';

const DB_NAME = 'subtracker-db';
const DB_VERSION = 1;
const STORE_NAME = 'subscriptions';

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  return dbInstance;
}

export async function loadAllSubscriptions(): Promise<Subscription[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all as Subscription[];
}

export async function saveSubscription(sub: Subscription): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, sub);
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function saveAllSubscriptions(subs: Subscription[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  for (const sub of subs) {
    await tx.store.put(sub);
  }
  await tx.done;
}
