import { WorkoutRecord, MealRecord, WeeklyPlan, UserSettings } from '../types';

const DB_NAME = 'FitTrackyDB';
const DB_VERSION = 1;

interface StoreNames {
  workoutRecords: WorkoutRecord;
  mealRecords: MealRecord;
  weeklyPlans: WeeklyPlan;
  userSettings: UserSettings;
}

type StoreName = keyof StoreNames;

class FitTrackyDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('workoutRecords')) {
          const workoutStore = db.createObjectStore('workoutRecords', { keyPath: 'id' });
          workoutStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('mealRecords')) {
          const mealStore = db.createObjectStore('mealRecords', { keyPath: 'id' });
          mealStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('weeklyPlans')) {
          const planStore = db.createObjectStore('weeklyPlans', { keyPath: 'id' });
          planStore.createIndex('weekStartDate', 'weekStartDate', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'id' });
        }
      };
    });
    
    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async add<T extends StoreName>(storeName: T, data: StoreNames[T]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async put<T extends StoreName>(storeName: T, data: StoreNames[T]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T extends StoreName>(storeName: T): Promise<StoreNames[T][]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as StoreNames[T][]);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T extends StoreName>(
    storeName: T,
    indexName: string,
    value: string
  ): Promise<StoreNames[T][]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result as StoreNames[T][]);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T extends StoreName>(storeName: T, id: string): Promise<StoreNames[T] | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as StoreNames[T] | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async delete<T extends StoreName>(storeName: T, id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear<T extends StoreName>(storeName: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new FitTrackyDB();
