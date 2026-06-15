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

  initFromIDB: () => Promise<void>;
  persistToIDB: () => Promise<void>;

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

export const useTravelStore = create<TravelStore>((set, get) => ({
  trips: [],
  photos: [],
  hydrating: true,

  initFromIDB: async () => {
    try {
      await idbKeys(idbStore);
      const tripsData = await idbGet('trips', idbStore);
      const photosData = await idbGet('photos', idbStore);
      set({
        trips: tripsData ? (tripsData as Trip[]) : [],
        photos: photosData ? (photosData as Photo[]) : [],
        hydrating: false
      });
    } catch (err) {
      console.error('Failed to load from IDB:', err);
      set({ hydrating: false });
    }
  },

  persistToIDB: async () => {
    try {
      await idbSet('trips', get().trips, idbStore);
      await idbSet('photos', get().photos, idbStore);
    } catch (err) {
      console.error('Failed to persist to IDB:', err);
    }
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
