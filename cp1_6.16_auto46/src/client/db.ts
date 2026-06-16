import type { SheetMusic, Annotation } from '../types';

const DB_NAME = 'SheetMusicDB';
const DB_VERSION = 1;
const SHEETS_STORE = 'sheets';
const ANNOTATIONS_STORE = 'annotations';

export class SheetMusicDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(SHEETS_STORE)) {
          const sheetStore = db.createObjectStore(SHEETS_STORE, { keyPath: 'id' });
          sheetStore.createIndex('spaceId', 'spaceId', { unique: false });
          sheetStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(ANNOTATIONS_STORE)) {
          const annStore = db.createObjectStore(ANNOTATIONS_STORE, { keyPath: 'id' });
          annStore.createIndex('sheetId', 'sheetId', { unique: false });
          annStore.createIndex('userId', 'userId', { unique: false });
          annStore.createIndex('measure', 'measure', { unique: false });
        }
      };
    });
  }

  async saveSheet(sheet: SheetMusic): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SHEETS_STORE, 'readwrite');
      const store = transaction.objectStore(SHEETS_STORE);
      const request = store.put({ ...sheet, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSheet(id: string): Promise<SheetMusic | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SHEETS_STORE, 'readonly');
      const store = transaction.objectStore(SHEETS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getSheetsBySpace(spaceId: string): Promise<SheetMusic[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SHEETS_STORE, 'readonly');
      const store = transaction.objectStore(SHEETS_STORE);
      const index = store.index('spaceId');
      const request = index.getAll(spaceId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSheet(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(SHEETS_STORE, 'readwrite');
      const store = transaction.objectStore(SHEETS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveAnnotation(sheetId: string, annotation: Annotation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(ANNOTATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(ANNOTATIONS_STORE);
      const request = store.put({ ...annotation, sheetId });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAnnotationsBySheet(sheetId: string): Promise<Annotation[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(ANNOTATIONS_STORE, 'readonly');
      const store = transaction.objectStore(ANNOTATIONS_STORE);
      const index = store.index('sheetId');
      const request = index.getAll(sheetId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAnnotation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(ANNOTATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(ANNOTATIONS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const sheetDB = new SheetMusicDB();
