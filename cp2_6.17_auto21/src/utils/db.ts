export type IssueType = 'duplication' | 'complexity' | 'long-function';
export type Severity = 'high' | 'medium' | 'low';

export interface Issue {
  id: string;
  type: IssueType;
  severity: Severity;
  lineStart: number;
  lineEnd: number;
  message: string;
  suggestion: string;
  functionName?: string;
  complexity?: number;
}

export interface AnalysisResult {
  issues: Issue[];
  stats: {
    total: number;
    duplication: number;
    complexity: number;
    longFunction: number;
  };
  timestamp: number;
}

export interface Thresholds {
  duplicationLines: number;
  complexity: number;
  maxFunctionLines: number;
}

export interface HistoryRecord {
  id: string;
  filename: string;
  code: string;
  result: AnalysisResult;
  thresholds: Thresholds;
  createdAt: number;
}

const DB_NAME = 'CodeReviewDB';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings');
      }

      if (!database.objectStoreNames.contains('history')) {
        const historyStore = database.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function saveToDB(storeName: 'settings', key: string, value: unknown): Promise<void>;
export async function saveToDB(storeName: 'history', key: string, value: HistoryRecord): Promise<void>;
export async function saveToDB(storeName: string, key: string, value: unknown): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = storeName === 'history' 
      ? store.put(value)
      : store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadFromDB(storeName: 'settings', key: string): Promise<Thresholds | null>;
export async function loadFromDB(storeName: 'history', key: string): Promise<HistoryRecord | null>;
export async function loadFromDB(storeName: string, key: string): Promise<unknown> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllHistory(): Promise<HistoryRecord[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('history', 'readonly');
    const store = transaction.objectStore('history');
    const index = store.index('createdAt');
    const request = index.openCursor(null, 'prev');
    const results: HistoryRecord[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromDB(storeName: string, key: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function cleanupOldHistory(maxRecords: number = 100): Promise<void> {
  const allRecords = await loadAllHistory();
  if (allRecords.length > maxRecords) {
    const toDelete = allRecords.slice(maxRecords);
    for (const record of toDelete) {
      await deleteFromDB('history', record.id);
    }
  }
}

export interface AnalysisState {
  code: string;
  filename: string;
  thresholds: Thresholds;
  result: AnalysisResult | null;
  selectedIssueId: string | null;
  isAnalyzing: boolean;
  highlightLineStart: number | null;
  highlightLineEnd: number | null;
  setCode: (code: string, filename?: string) => void;
  setFilename: (filename: string) => void;
  setThresholds: (thresholds: Partial<Thresholds>) => Promise<void>;
  loadThresholds: () => Promise<void>;
  analyzeCode: () => Promise<void>;
  selectIssue: (id: string | null) => void;
  clearHighlight: () => void;
  loadFromHistory: (record: HistoryRecord) => void;
  setHighlight: (start: number | null, end: number | null) => void;
}
