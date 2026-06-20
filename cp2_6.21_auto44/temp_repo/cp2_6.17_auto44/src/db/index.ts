import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { BrewRecord } from '../types';

interface CaffeineDB extends DBSchema {
  records: {
    key: string;
    value: BrewRecord;
    indexes: { 'by-date': string; 'by-bean': string };
  };
}

let dbPromise: Promise<IDBPDatabase<CaffeineDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<CaffeineDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<CaffeineDB>('caffeine-log-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('records')) {
          const store = db.createObjectStore('records', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
          store.createIndex('by-bean', 'bean');
        }
      },
    });
  }
  return dbPromise;
};

export const getAllRecords = async (): Promise<BrewRecord[]> => {
  const db = await getDB();
  return db.getAll('records');
};

export const addRecordDB = async (record: BrewRecord): Promise<void> => {
  const db = await getDB();
  await db.put('records', record);
};

export const deleteRecordDB = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('records', id);
};

export const bulkAddRecordsDB = async (records: BrewRecord[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('records', 'readwrite');
  for (const record of records) {
    tx.store.put(record);
  }
  await tx.done;
};
