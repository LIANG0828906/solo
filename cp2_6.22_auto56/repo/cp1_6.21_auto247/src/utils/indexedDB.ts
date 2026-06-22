import { Brick } from '../store/useAppStore';

export interface SavedModel {
  id: string;
  name: string;
  thumbnail: string;
  bricks: Brick[];
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = 'lego-3d-builder';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const MAX_MODELS = 10;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

export async function saveModel(model: SavedModel): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const existing = await getAllModels();
  if (existing.length >= MAX_MODELS && !existing.find(m => m.id === model.id)) {
    const sorted = existing.sort((a, b) => a.updatedAt - b.updatedAt);
    const oldest = sorted[0];
    store.delete(oldest.id);
  }

  store.put(model);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function getAllModels(): Promise<SavedModel[]> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      const models = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(models);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteModel(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.delete(id);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
