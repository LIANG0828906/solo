import type { Doodle } from '../types';

const DB_NAME = 'flowscape_db';
const DB_VERSION = 1;
const STORE_NAME = 'doodles';

class StorageManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const database = await this.init();
    const tx = database.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  }

  async saveDoodle(doodle: Doodle): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await this.getStore('readwrite');
        const request = store.put(doodle);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async deleteDoodle(id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await this.getStore('readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getDoodle(id: string): Promise<Doodle | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await this.getStore('readonly');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getAllDoodles(): Promise<Doodle[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await this.getStore('readonly');
        const request = store.getAll();
        request.onsuccess = () => {
          const result: Doodle[] = request.result || [];
          result.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getDoodlesPaged(page: number, pageSize: number): Promise<{ doodles: Doodle[]; total: number }> {
    const all = await this.getAllDoodles();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      doodles: all.slice(start, end),
      total: all.length
    };
  }
}

export const storageManager = new StorageManager();
