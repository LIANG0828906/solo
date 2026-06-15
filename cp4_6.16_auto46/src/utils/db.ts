const DB_NAME = 'artist-card-db';
const DB_VERSION = 1;

type StoreName = 'artist' | 'musicTracks' | 'tourDates';

let dbInstance: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('artist')) {
        db.createObjectStore('artist', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('musicTracks')) {
        db.createObjectStore('musicTracks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tourDates')) {
        db.createObjectStore('tourDates', { keyPath: 'id' });
      }
    };
  });
}

export async function addItem(storeName: StoreName, item: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to add item to ${storeName}`));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed for ${storeName}`));
    };
  });
}

export async function getAll(storeName: StoreName): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get all items from ${storeName}`));
    };
  });
}

export async function updateItem(storeName: StoreName, id: string, updates: Partial<any>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (existing) {
        const updated = { ...existing, ...updates, updatedAt: Date.now() };
        const putRequest = store.put(updated);
        
        putRequest.onsuccess = () => {
          resolve();
        };
        
        putRequest.onerror = () => {
          reject(new Error(`Failed to update item in ${storeName}`));
        };
      } else {
        reject(new Error(`Item with id ${id} not found in ${storeName}`));
      }
    };

    getRequest.onerror = () => {
      reject(new Error(`Failed to get item from ${storeName}`));
    };
  });
}

export async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete item from ${storeName}`));
    };
  });
}

export async function getItem(storeName: StoreName, id: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get item from ${storeName}`));
    };
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear ${storeName}`));
    };
  });
}
