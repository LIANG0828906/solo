import type { Pixel } from '../pixelBoard/types';

const DB_NAME = 'PixelPaletteDB';
const DB_VERSION = 1;
const STORE_NAME = 'pixels';

export class PixelStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('x', 'x', { unique: false });
          store.createIndex('y', 'y', { unique: false });
        }
      };
    });
  }

  async savePixels(pixels: Pixel[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);
      clearRequest.onsuccess = () => {
        let completed = 0;
        if (pixels.length === 0) {
          resolve();
          return;
        }

        for (const pixel of pixels) {
          const addRequest = store.add(pixel);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === pixels.length) {
              resolve();
            }
          };
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
    });
  }

  async loadPixels(): Promise<Pixel[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result as Pixel[]);
      };
    });
  }

  async clearPixels(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const pixelStorage = new PixelStorage();
