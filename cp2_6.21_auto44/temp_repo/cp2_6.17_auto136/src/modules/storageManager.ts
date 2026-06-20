import type { Doodle } from '@/types';
import { GALLERY_PAGE_SIZE } from '@/types';

const DB_NAME = 'flowscape_db';
const DB_VERSION = 1;
const STORE_NAME = 'doodles';

let dbInstance: IDBDatabase | null = null;

export function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function saveDoodle(doodle: Doodle): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(doodle);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDoodle(id: string): Promise<Doodle | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as Doodle) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listDoodles(
  page: number = 1,
  pageSize: number = GALLERY_PAGE_SIZE,
): Promise<{ items: Doodle[]; total: number }> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const countRequest = store.count();

    let total = 0;
    countRequest.onsuccess = () => {
      total = countRequest.result as number;
    };
    countRequest.onerror = () => reject(countRequest.error);

    const items: Doodle[] = [];
    const skip = (page - 1) * pageSize;
    let count = 0;

    const cursorRequest = index.openCursor(null, 'prev');
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        if (count >= skip && count < skip + pageSize) {
          items.push(cursor.value as Doodle);
        }
        count++;
        if (count < skip + pageSize) {
          cursor.continue();
        } else {
          resolve({ items, total });
        }
      } else {
        resolve({ items, total });
      }
    };
    cursorRequest.onerror = () => reject(cursorRequest.error);
  });
}

export async function deleteDoodle(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function exportDoodle(id: string): Promise<void> {
  const doodle = await getDoodle(id);
  if (!doodle) throw new Error('Doodle not found');

  const blob = new Blob([JSON.stringify(doodle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doodle.name || 'doodle'}-${id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
