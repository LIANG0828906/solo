const DB_NAME = 'WritingAssistant';
const DB_VERSION = 1;
const STORE_DRAFTS = 'drafts';

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const d = (event.target as IDBOpenDBRequest).result;
      if (!d.objectStoreNames.contains(STORE_DRAFTS)) {
        d.createObjectStore(STORE_DRAFTS, { keyPath: 'chapterId' });
      }
    };
  });
}

export interface Draft {
  chapterId: string;
  projectId: string;
  content: string;
  title: string;
  savedAt: number;
}

export async function saveDraft(draft: Draft): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    const req = store.put({ ...draft, savedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getDraft(chapterId: string): Promise<Draft | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_DRAFTS);
    const req = store.get(chapterId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDraft(chapterId: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    const req = store.delete(chapterId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
