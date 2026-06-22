import type { Plant, CareRecord } from '../types';

const DB_NAME = 'succucare-db';
const DB_VERSION = 1;
const STORE_PLANTS = 'plants';
const STORE_RECORDS = 'careRecords';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PLANTS)) {
        db.createObjectStore(STORE_PLANTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        const store = db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
        store.createIndex('plantId', 'plantId', { unique: false });
      }
    };
  });
}

export async function savePlants(plants: Plant[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_PLANTS, 'readwrite');
  const store = tx.objectStore(STORE_PLANTS);
  store.clear();
  for (const plant of plants) {
    store.add(plant);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadPlants(): Promise<Plant[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_PLANTS, 'readonly');
  const store = tx.objectStore(STORE_PLANTS);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function saveCareRecords(records: CareRecord[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_RECORDS, 'readwrite');
  const store = tx.objectStore(STORE_RECORDS);
  store.clear();
  for (const record of records) {
    store.add(record);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadCareRecords(): Promise<CareRecord[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_RECORDS, 'readonly');
  const store = tx.objectStore(STORE_RECORDS);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}
