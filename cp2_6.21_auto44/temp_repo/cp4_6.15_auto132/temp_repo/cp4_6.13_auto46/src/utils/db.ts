const DB_NAME = 'lumen-photo-db';
const DB_VERSION = 1;
const STORE_PHOTOS = 'photos';
const STORE_PORTFOLIOS = 'portfolios';
const STORE_BLOBS = 'blobs';

interface StoredPhoto {
  id: string;
  data: unknown;
}

interface StoredPortfolio {
  id: string;
  data: unknown;
}

interface StoredBlob {
  id: string;
  blob: Blob;
}

class PhotoDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(STORE_PHOTOS)) {
          database.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(STORE_PORTFOLIOS)) {
          database.createObjectStore(STORE_PORTFOLIOS, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(STORE_BLOBS)) {
          database.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });

    return this.initPromise;
  }

  private async withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
  ): Promise<T> {
    const database = await this.init();
    return new Promise<T>((resolve, reject) => {
      const tx = database.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      tx.oncomplete = () => {
        if (result instanceof IDBRequest) {
          resolve(result.result as T);
        }
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      if (result instanceof IDBRequest) {
        result.onsuccess = () => resolve(result.result as T);
        result.onerror = () => reject(result.error);
      } else if (result instanceof Promise) {
        result.then(resolve).catch(reject);
      }
    });
  }

  async savePhoto(id: string, data: unknown): Promise<void> {
    const record: StoredPhoto = { id, data };
    await this.withStore(STORE_PHOTOS, 'readwrite', (s) => s.put(record));
  }

  async deletePhoto(id: string): Promise<void> {
    await this.withStore(STORE_PHOTOS, 'readwrite', (s) => s.delete(id));
    await this.deleteBlob(id);
  }

  async getAllPhotos(): Promise<unknown[]> {
    const list = await this.withStore<StoredPhoto[]>(STORE_PHOTOS, 'readonly', (s) => s.getAll());
    return list.map((i) => i.data);
  }

  async saveBlob(id: string, blob: Blob): Promise<void> {
    const record: StoredBlob = { id, blob };
    await this.withStore(STORE_BLOBS, 'readwrite', (s) => s.put(record));
  }

  async getBlob(id: string): Promise<Blob | null> {
    const record = await this.withStore<StoredBlob | undefined>(STORE_BLOBS, 'readonly', (s) => s.get(id));
    return record?.blob ?? null;
  }

  async deleteBlob(id: string): Promise<void> {
    await this.withStore(STORE_BLOBS, 'readwrite', (s) => s.delete(id));
  }

  async savePortfolio(id: string, data: unknown): Promise<void> {
    const record: StoredPortfolio = { id, data };
    await this.withStore(STORE_PORTFOLIOS, 'readwrite', (s) => s.put(record));
  }

  async deletePortfolio(id: string): Promise<void> {
    await this.withStore(STORE_PORTFOLIOS, 'readwrite', (s) => s.delete(id));
  }

  async getAllPortfolios(): Promise<unknown[]> {
    const list = await this.withStore<StoredPortfolio[]>(STORE_PORTFOLIOS, 'readonly', (s) => s.getAll());
    return list.map((i) => i.data);
  }
}

export const db = new PhotoDB();
