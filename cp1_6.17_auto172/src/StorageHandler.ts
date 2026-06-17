import { openDB, IDBPDatabase } from 'idb';
import { ChartData } from './types';

const DB_NAME = 'astro-chart-db';
const DB_VERSION = 1;
const STORE_NAME = 'charts';

interface ChartDB {
  id: string;
  data: ChartData;
  createdAt: number;
  updatedAt: number;
}

class StorageHandler {
  private db: IDBPDatabase | null = null;

  private async initDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB<ChartDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
        }
      },
    });

    return this.db;
  }

  async saveChart(chartData: ChartData): Promise<void> {
    const db = await this.initDB();
    const now = Date.now();
    
    const existing = await db.get(STORE_NAME, chartData.id);
    
    if (existing) {
      await db.put(STORE_NAME, {
        id: chartData.id,
        data: chartData,
        createdAt: existing.createdAt,
        updatedAt: now,
      });
    } else {
      await db.add(STORE_NAME, {
        id: chartData.id,
        data: chartData,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async getChart(id: string): Promise<ChartData | null> {
    const db = await this.initDB();
    const result = await db.get(STORE_NAME, id);
    return result ? result.data : null;
  }

  async getAllCharts(): Promise<ChartData[]> {
    const db = await this.initDB();
    const results = await db.getAllFromIndex(STORE_NAME, 'createdAt');
    return results
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(r => r.data);
  }

  async deleteChart(id: string): Promise<void> {
    const db = await this.initDB();
    await db.delete(STORE_NAME, id);
  }

  async clearAll(): Promise<void> {
    const db = await this.initDB();
    await db.clear(STORE_NAME);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const storageHandler = new StorageHandler();
export default StorageHandler;
