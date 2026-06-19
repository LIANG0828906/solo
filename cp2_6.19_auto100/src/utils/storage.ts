import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, isSameDay, parseISO } from 'date-fns';

export type TaskType = 'work' | 'study' | 'exercise';

export interface PomodoroRecord {
  id: string;
  taskName: string;
  taskDescription: string;
  taskType: TaskType;
  duration: number;
  moodScore: number;
  completedAt: string;
  index: number;
}

interface PomodoroDB extends DBSchema {
  pomodoros: {
    key: string;
    value: PomodoroRecord;
    indexes: {
      completedAt: string;
      taskType: TaskType;
    };
  };
}

const DB_NAME = 'pomodoro-db';
const DB_VERSION = 1;
const STORE_NAME = 'pomodoros';

let dbPromise: Promise<IDBPDatabase<PomodoroDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PomodoroDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PomodoroDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('completedAt', 'completedAt', { unique: false });
          store.createIndex('taskType', 'taskType', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function addRecord(record: Omit<PomodoroRecord, 'id'>): Promise<PomodoroRecord> {
  const db = await getDB();
  const fullRecord: PomodoroRecord = { ...record, id: uuidv4() };
  await db.add(STORE_NAME, fullRecord);
  return fullRecord;
}

export async function getAllRecords(): Promise<PomodoroRecord[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function getTodayRecords(): Promise<PomodoroRecord[]> {
  const records = await getAllRecords();
  const today = startOfDay(new Date());
  return records
    .filter((r) => isSameDay(parseISO(r.completedAt), today))
    .sort((a, b) => parseISO(a.completedAt).getTime() - parseISO(b.completedAt).getTime());
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function clearAllRecords(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
