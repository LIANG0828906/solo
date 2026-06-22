import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  get as idbGet,
  set as idbSet,
  createStore,
  keys as idbKeys
} from 'idb-keyval';
import type { Trip, Photo } from './types';

const idbStore = createStore('travel-tracker-db', 'travel-store');

interface TravelStore {
  trips: Trip[];
  photos: Photo[];
  hydrating: boolean;
  hydrationError: string | null;
  retryCount: number;

  initFromIDB: () => Promise<void>;
  retryHydration: () => Promise<void>;
  resetHydrationError: () => void;
  persistToIDB: () => Promise<boolean>;

  createTrip: (data: Omit<Trip, 'id' | 'createdAt'>) => void;
  updateTrip: (id: string, data: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;

  addPhotos: (photos: Omit<Photo, 'id'>[]) => void;
  updatePhoto: (id: string, data: Partial<Photo>) => void;
  deletePhoto: (id: string) => void;
  getPhotosByTripId: (tripId: string) => Photo[];
  deletePhotosByTripId: (tripId: string) => void;
}

const MAX_RETRY = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptLoadFromIDB(): Promise<{ trips: Trip[]; photos: Photo[] } | null> {
  try {
    await idbKeys(idbStore);
    const tripsData = await idbGet('trips', idbStore);
    const photosData = await idbGet('photos', idbStore);
    return {
      trips: tripsData ? (tripsData as Trip[]) : [],
      photos: photosData ? (photosData as Photo[]) : []
    };
  } catch {
    return null;
  }
}

export const useTravelStore = create<TravelStore>((set, get) => ({
  trips: [],
  photos: [],
  hydrating: true,
  hydrationError: null,
  retryCount: 0,

  initFromIDB: async () => {
    let retry = 0;
    let result: { trips: Trip[]; photos: Photo[] } | null = null;

    while (retry < MAX_RETRY) {
      result = await attemptLoadFromIDB();
      if (result) break;
      retry++;
      if (retry < MAX_RETRY) {
        set({ retryCount: retry });
        await sleep(RETRY_DELAY_MS);
      }
    }

    if (result) {
      set({
        trips: result.trips,
        photos: result.photos,
        hydrating: false,
        hydrationError: null,
        retryCount: retry
      });
    } else {
      set({
        hydrating: false,
        hydrationError:
          '数据加载失败，请检查浏览器是否允许IndexedDB存储，或点击重试按钮重新加载。',
        retryCount: retry
      });
    }
  },

  retryHydration: async () => {
    set({ hydrating: true, hydrationError: null, retryCount: 0 });
    await get().initFromIDB();
  },

  resetHydrationError: () => {
    set({ hydrationError: null });
  },

  persistToIDB: async () => {
    let success = false;
    for (let i = 0; i < 2 && !success; i++) {
      try {
        await idbSet('trips', get().trips, idbStore);
        await idbSet('photos', get().photos, idbStore);
        success = true;
      } catch {
        if (i < 1) await sleep(RETRY_DELAY_MS);
      }
    }
    if (!success) {
      console.warn('[Store] persistToIDB failed after 2 attempts');
    }
    return success;
  },

  createTrip: (data) => {
    const newTrip: Trip = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    set((state) => ({ trips: [...state.trips, newTrip] }));
    void get().persistToIDB();
  },

  updateTrip: (id, data) => {
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...data } : t))
    }));
    void get().persistToIDB();
  },

  deleteTrip: (id) => {
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      photos: state.photos.filter((p) => p.tripId !== id)
    }));
    void get().persistToIDB();
  },

  getTripById: (id) => {
    return get().trips.find((t) => t.id === id);
  },

  addPhotos: (photos) => {
    const newPhotos = photos.map((p) => ({ ...p, id: uuidv4() }));
    set((state) => ({ photos: [...state.photos, ...newPhotos] }));
    void get().persistToIDB();
  },

  updatePhoto: (id, data) => {
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, ...data } : p))
    }));
    void get().persistToIDB();
  },

  deletePhoto: (id) => {
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id)
    }));
    void get().persistToIDB();
  },

  getPhotosByTripId: (tripId) => {
    return get()
      .photos.filter((p) => p.tripId === tripId)
      .sort((a, b) => new Date(a.captureTime).getTime() - new Date(b.captureTime).getTime());
  },

  deletePhotosByTripId: (tripId) => {
    set((state) => ({
      photos: state.photos.filter((p) => p.tripId !== tripId)
    }));
    void get().persistToIDB();
  }
}));
