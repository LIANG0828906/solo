import type { VersionSnapshot } from '@/types';

const DB_NAME = 'poster-designer-db';
const DB_VERSION = 1;
const STORE_VERSIONS = 'versions';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_VERSIONS)) {
        const store = db.createObjectStore(STORE_VERSIONS, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

const MAX_VERSIONS = 10;

export async function saveVersion(snapshot: VersionSnapshot): Promise<void> {
  const db = await openDB();
  const all = await getAllVersions();
  if (all.length >= MAX_VERSIONS) {
    const sorted = [...all].sort((a, b) => a.timestamp - b.timestamp);
    const toDelete = sorted.slice(0, all.length - MAX_VERSIONS + 1);
    for (const v of toDelete) {
      await deleteVersion(v.id);
    }
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_VERSIONS);
    const req = store.put(snapshot);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
  });
}

export async function getAllVersions(): Promise<VersionSnapshot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readonly');
    const store = tx.objectStore(STORE_VERSIONS);
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result || []) as VersionSnapshot[]);
  });
}

export async function deleteVersion(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_VERSIONS);
    const req = store.delete(id);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
  });
}
