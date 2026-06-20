import { Note, User } from '../types';

const DB_NAME = 'voice-map-db';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_USER = 'user';
const STORE_META = 'metadata';

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        const notesStore = db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
        notesStore.createIndex('languageFamily', 'languageFamily', { unique: false });
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_USER)) {
        db.createObjectStore(STORE_USER, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
  });
}

export async function saveNotesToCache(notes: Note[]): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NOTES, 'readwrite');
  const store = transaction.objectStore(STORE_NOTES);

  store.clear();

  notes.forEach((note) => {
    store.add(note);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getNotesFromCache(): Promise<Note[]> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NOTES, 'readonly');
  const store = transaction.objectStore(STORE_NOTES);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveUserToCache(user: User): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_USER, 'readwrite');
  const store = transaction.objectStore(STORE_USER);

  store.clear();
  store.add(user);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getUserFromCache(): Promise<User | null> {
  const db = await openDB();
  const transaction = db.transaction(STORE_USER, 'readonly');
  const store = transaction.objectStore(STORE_USER);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const users = request.result;
      resolve(users.length > 0 ? users[0] : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setCacheTimestamp(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_META, 'readwrite');
  const store = transaction.objectStore(STORE_META);
  store.put({ key: 'lastSync', value: Date.now() });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getLastSyncTime(): Promise<number | null> {
  const db = await openDB();
  const transaction = db.transaction(STORE_META, 'readonly');
  const store = transaction.objectStore(STORE_META);
  const request = store.get('lastSync');

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearCache(): Promise<void> {
  const db = await openDB();
  const stores = [STORE_NOTES, STORE_USER, STORE_META];
  
  for (const storeName of stores) {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).clear();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, 'readwrite');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
