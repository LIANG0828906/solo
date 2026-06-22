import { v4 as uuidv4 } from 'uuid';
import type { CodeVersion, Language } from '../types';

const STORAGE_KEY = 'code_versions';
const DB_NAME = 'CodeSnippetDB';
const DB_VERSION = 1;
const STORE_NAME = 'versions';
const MAX_VERSIONS = 100;

class LocalStore {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.dbReady;
    }
  }

  async saveVersion(code: string, language: Language): Promise<CodeVersion> {
    await this.ensureDB();

    const version: CodeVersion = {
      id: uuidv4(),
      code,
      language,
      timestamp: Date.now(),
      lineCount: code.split('\n').length,
    };

    const allVersions = await this.getVersionList();

    if (allVersions.length >= MAX_VERSIONS) {
      const oldest = allVersions[allVersions.length - 1];
      await this.deleteVersion(oldest.id);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('DB not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(version);

      request.onsuccess = () => {
        this.saveMetaToLocalStorage(version);
        resolve(version);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private saveMetaToLocalStorage(version: CodeVersion): void {
    const metaKey = `${STORAGE_KEY}_meta`;
    let metaList: Array<{ id: string; timestamp: number; lineCount: number; language: Language }> = [];

    try {
      const stored = localStorage.getItem(metaKey);
      if (stored) {
        metaList = JSON.parse(stored);
      }
    } catch {
      metaList = [];
    }

    metaList.unshift({
      id: version.id,
      timestamp: version.timestamp,
      lineCount: version.lineCount,
      language: version.language,
    });

    if (metaList.length > MAX_VERSIONS) {
      metaList = metaList.slice(0, MAX_VERSIONS);
    }

    try {
      localStorage.setItem(metaKey, JSON.stringify(metaList));
    } catch {
      console.warn('localStorage quota exceeded');
    }
  }

  async loadVersion(id: string): Promise<CodeVersion | null> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('DB not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getVersionList(): Promise<CodeVersion[]> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('DB not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      const versions: CodeVersion[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          versions.push(cursor.value);
          cursor.continue();
        } else {
          resolve(versions.slice(0, MAX_VERSIONS));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteVersion(id: string): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('DB not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.removeMetaFromLocalStorage(id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private removeMetaFromLocalStorage(id: string): void {
    const metaKey = `${STORAGE_KEY}_meta`;
    try {
      const stored = localStorage.getItem(metaKey);
      if (stored) {
        const metaList = JSON.parse(stored);
        const filtered = metaList.filter((m: { id: string }) => m.id !== id);
        localStorage.setItem(metaKey, JSON.stringify(filtered));
      }
    } catch {
      console.warn('Failed to update localStorage meta');
    }
  }

  async clearAll(): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('DB not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        localStorage.removeItem(`${STORAGE_KEY}_meta`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const localStore = new LocalStore();
