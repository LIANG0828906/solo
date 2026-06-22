import type { Capsule, Attachment } from '@/types';

const DB_NAME = 'memoryvault_db';
const DB_VERSION = 1;
const CAPSULES_STORE = 'capsules';
const ATTACHMENTS_STORE = 'attachments';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(CAPSULES_STORE)) {
        const capsuleStore = db.createObjectStore(CAPSULES_STORE, { keyPath: 'id' });
        capsuleStore.createIndex('openDate', 'openDate', { unique: false });
        capsuleStore.createIndex('isPrivate', 'isPrivate', { unique: false });
        capsuleStore.createIndex('openedAt', 'openedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(ATTACHMENTS_STORE)) {
        const attachmentStore = db.createObjectStore(ATTACHMENTS_STORE, { keyPath: 'id' });
        attachmentStore.createIndex('capsuleId', 'capsuleId', { unique: false });
      }
    };
  });
}

async function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    Promise.resolve(callback(store))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        if (mode === 'readonly') resolve(result);
      })
      .catch(reject);

    tx.onerror = () => reject(tx.error);
  });
}

export async function saveCapsule(capsule: Capsule): Promise<void> {
  await transaction(CAPSULES_STORE, 'readwrite', (store) => {
    store.put(capsule);
  });
}

export async function saveAttachment(attachment: Attachment): Promise<void> {
  await transaction(ATTACHMENTS_STORE, 'readwrite', (store) => {
    store.put(attachment);
  });
}

export async function getAllCapsules(): Promise<Capsule[]> {
  return transaction<Capsule[]>(CAPSULES_STORE, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Capsule[]);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function getAttachment(id: string): Promise<Attachment | null> {
  return transaction<Attachment | null>(ATTACHMENTS_STORE, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as Attachment) || null);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function deleteCapsule(id: string): Promise<void> {
  await transaction(CAPSULES_STORE, 'readwrite', (store) => {
    store.delete(id);
  });
}

export async function updateCapsule(capsule: Capsule): Promise<void> {
  await saveCapsule(capsule);
}

export async function getAttachmentsByCapsuleId(capsuleId: string): Promise<Attachment[]> {
  return transaction<Attachment[]>(ATTACHMENTS_STORE, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const index = store.index('capsuleId');
      const request = index.getAll(capsuleId);
      request.onsuccess = () => resolve(request.result as Attachment[]);
      request.onerror = () => reject(request.error);
    });
  });
}
