import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Trip, TripFormData } from './types';

const STORAGE_KEY = 'trip_tracker_trips';

interface TripState {
  trips: Trip[];
  currentTripId: string | null;
  
  addTrip: (trip: TripFormData) => void;
  switchTrip: (tripId: string | null) => void;
  getTripById: (tripId: string) => Trip | undefined;
  updateTrip: (tripId: string, updates: Partial<TripFormData>) => void;
  deleteTrip: (tripId: string) => void;
}

const loadFromStorage = (): Trip[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load trips from storage:', e);
  }
  return null;
};

const saveToStorage = (trips: Trip[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Failed to save trips to storage:', e);
  }
};

const generateMockTrips = (): Trip[] => {
  return [
    {
      id: uuidv4(),
      destination: '东京之旅',
      currency: 'JPY',
      budget: 150000,
      startDate: '2026-06-01',
      endDate: '2026-06-10',
    },
    {
      id: uuidv4(),
      destination: '欧洲环游',
      currency: 'EUR',
      budget: 3000,
      startDate: '2026-07-15',
      endDate: '2026-08-05',
    },
    {
      id: uuidv4(),
      destination: '泰国自由行',
      currency: 'CNY',
      budget: 8000,
      startDate: '2026-09-01',
      endDate: '2026-09-07',
    },
  ];
};

const persistedTrips = loadFromStorage();
const initialTrips = persistedTrips || generateMockTrips();

export const useTripStore = create<TripState>((set, get) => ({
  trips: initialTrips,
  currentTripId: initialTrips.length > 0 ? initialTrips[0].id : null,
  
  addTrip: (tripData) => {
    const newTrip: Trip = {
      ...tripData,
      id: uuidv4(),
    };
    set((state) => {
      const trips = [...state.trips, newTrip];
      saveToStorage(trips);
      return { trips, currentTripId: newTrip.id };
    });
  },
  
  switchTrip: (tripId) => {
    set({ currentTripId: tripId });
  },
  
  getTripById: (tripId) => {
    return get().trips.find((t) => t.id === tripId);
  },
  
  updateTrip: (tripId, updates) => {
    set((state) => {
      const trips = state.trips.map((t) =>
        t.id === tripId ? { ...t, ...updates } : t
      );
      saveToStorage(trips);
      return { trips };
    });
  },
  
  deleteTrip: (tripId) => {
    set((state) => {
      const trips = state.trips.filter((t) => t.id !== tripId);
      saveToStorage(trips);
      const newCurrentId = state.currentTripId === tripId
        ? (trips.length > 0 ? trips[0].id : null)
        : state.currentTripId;
      return { trips, currentTripId: newCurrentId };
    });
  },
}));

export default useTripStore;
