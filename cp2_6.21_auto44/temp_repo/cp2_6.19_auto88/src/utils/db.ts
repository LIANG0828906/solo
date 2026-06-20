import type { Recipe, Comment, Activity, Favorite, User, Rating } from '../types';

type StoreType = 'recipes' | 'comments' | 'activities' | 'favorites' | 'users' | 'ratings';
type DataType = Recipe | Comment | Activity | Favorite | User | Rating;

interface StoreConfig {
  keyPath: string;
  indexes: Array<{ name: string; keyPath: string | string[]; unique?: boolean }>;
}

const DB_NAME = 'RecipeShareDB';
const DB_VERSION = 1;

const storeConfigs: Record<StoreType, StoreConfig> = {
  recipes: {
    keyPath: 'id',
    indexes: [
      { name: 'authorId', keyPath: 'authorId', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'rating', keyPath: 'rating', unique: false },
    ],
  },
  comments: {
    keyPath: 'id',
    indexes: [
      { name: 'recipeId', keyPath: 'recipeId', unique: false },
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },
  activities: {
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },
  favorites: {
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'recipeId', keyPath: 'recipeId', unique: false },
      { name: 'userId-recipeId', keyPath: ['userId', 'recipeId'], unique: true },
    ],
  },
  users: {
    keyPath: 'id',
    indexes: [
      { name: 'nickname', keyPath: 'nickname', unique: true },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },
  ratings: {
    keyPath: 'id',
    indexes: [
      { name: 'recipeId', keyPath: 'recipeId', unique: false },
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'userId-recipeId', keyPath: ['userId', 'recipeId'], unique: true },
    ],
  },
};

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      (Object.keys(storeConfigs) as StoreType[]).forEach((storeName) => {
        const config = storeConfigs[storeName];
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
          config.indexes.forEach((index) => {
            store.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }
      });
    };
  });
}

export async function initDB(): Promise<void> {
  await openDB();
}

async function getStore(storeName: StoreType, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Request failed: ${request.error?.message}`));
  });
}

export async function get<T extends DataType>(storeName: StoreType, id: string): Promise<T | undefined> {
  const store = await getStore(storeName, 'readonly');
  const result = await promisifyRequest(store.get(id));
  return result as T | undefined;
}

export async function getAll<T extends DataType>(storeName: StoreType): Promise<T[]> {
  const store = await getStore(storeName, 'readonly');
  const result = await promisifyRequest(store.getAll());
  return result as T[];
}

export async function add<T extends DataType>(storeName: StoreType, data: T): Promise<string> {
  const store = await getStore(storeName, 'readwrite');
  const result = await promisifyRequest(store.add(data));
  return result as string;
}

export async function put<T extends DataType>(storeName: StoreType, data: T): Promise<string> {
  const store = await getStore(storeName, 'readwrite');
  const result = await promisifyRequest(store.put(data));
  return result as string;
}

export async function update<T extends DataType>(storeName: StoreType, id: string, data: Partial<T>): Promise<T | undefined> {
  const store = await getStore(storeName, 'readwrite');
  const existing = await promisifyRequest(store.get(id));
  if (!existing) {
    return undefined;
  }
  const updated = { ...existing, ...data } as T;
  await promisifyRequest(store.put(updated));
  return updated;
}

export async function remove(storeName: StoreType, id: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  await promisifyRequest(store.delete(id));
}

export async function getByIndex<T extends DataType>(
  storeName: StoreType,
  indexName: string,
  value: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const store = await getStore(storeName, 'readonly');
  const index = store.index(indexName);
  const result = await promisifyRequest(index.getAll(value));
  return result as T[];
}
