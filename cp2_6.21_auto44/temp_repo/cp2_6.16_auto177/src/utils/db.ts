let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

const DB_NAME = 'swapbazaar_db';
const DB_VERSION = 1;

export type StoreName = 'users' | 'items' | 'offers';

export interface DBSchema {
  users: { key: string; value: any };
  items: { key: string; value: any };
  offers: { key: string; value: any };
}

export function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('name', 'name', { unique: true });
      }

      if (!db.objectStoreNames.contains('items')) {
        const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
        itemsStore.createIndex('sellerId', 'sellerId', { unique: false });
        itemsStore.createIndex('status', 'status', { unique: false });
        itemsStore.createIndex('category', 'category', { unique: false });
        itemsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('offers')) {
        const offersStore = db.createObjectStore('offers', { keyPath: 'id' });
        offersStore.createIndex('itemId', 'itemId', { unique: false });
        offersStore.createIndex('buyerId', 'buyerId', { unique: false });
        offersStore.createIndex('status', 'status', { unique: false });
        offersStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });

  return initPromise;
}

export async function addRecord<T>(storeName: StoreName, record: T): Promise<T> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(record);
    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

export async function putRecord<T>(storeName: StoreName, record: T): Promise<T> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(record);
    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecord<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecordsByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function countRecords(storeName: StoreName): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result || 0);
    request.onerror = () => reject(request.error);
  });
}
