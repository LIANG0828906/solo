import type { Property, Booking } from '@/types';

const DB_NAME = 'property-dashboard-db';
const DB_VERSION = 1;
const PROPERTIES_STORE = 'properties';
const BOOKINGS_STORE = 'bookings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PROPERTIES_STORE)) {
        const propsStore = db.createObjectStore(PROPERTIES_STORE, { keyPath: 'id' });
        propsStore.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains(BOOKINGS_STORE)) {
        const bookingsStore = db.createObjectStore(BOOKINGS_STORE, { keyPath: 'id' });
        bookingsStore.createIndex('propertyId', 'propertyId', { unique: false });
        bookingsStore.createIndex('date', 'date', { unique: false });
        bookingsStore.createIndex('propertyId_date', ['propertyId', 'date'], { unique: false });
      }
    };
  });
}

export async function getAllProperties(): Promise<Property[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROPERTIES_STORE, 'readonly');
    const store = tx.objectStore(PROPERTIES_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProperties(properties: Property[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROPERTIES_STORE, 'readwrite');
    const store = tx.objectStore(PROPERTIES_STORE);
    store.clear();
    properties.forEach((p) => store.put(p));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllBookings(): Promise<Booking[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKINGS_STORE, 'readonly');
    const store = tx.objectStore(BOOKINGS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKINGS_STORE, 'readwrite');
    const store = tx.objectStore(BOOKINGS_STORE);
    store.clear();
    bookings.forEach((b) => store.put(b));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
