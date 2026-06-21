import { create } from 'zustand';
import { tripApi } from '../dataStore';
import type { Trip, Activity, Location, CreateTripData, CreateActivityData, CreateLocationData, SearchFilters } from '../types';

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  highlightedTripId: string | null;
  
  fetchAllTrips: () => Promise<void>;
  fetchTripById: (id: string) => Promise<void>;
  createTrip: (data: CreateTripData) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  
  addActivity: (tripId: string, activity: CreateActivityData) => Promise<void>;
  updateActivity: (tripId: string, activityId: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (tripId: string, activityId: string) => Promise<void>;
  reorderActivities: (tripId: string, activityIds: string[], dayIndex: number) => Promise<void>;
  
  addLocation: (tripId: string, location: CreateLocationData) => Promise<Location>;
  deleteLocation: (tripId: string, locationId: string) => Promise<void>;
  
  setFilters: (filters: Partial<SearchFilters>) => void;
  setHighlightedTrip: (id: string | null) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  
  getFilteredTrips: () => Trip[];
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,
  filters: { keyword: '' },
  highlightedTripId: null,

  fetchAllTrips: async () => {
    set({ loading: true, error: null });
    try {
      const trips = await tripApi.getAll();
      set({ trips, loading: false });
    } catch (err) {
      set({ error: 'Failed to load trips', loading: false });
    }
  },

  fetchTripById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const trip = await tripApi.getById(id);
      set({ currentTrip: trip, loading: false });
    } catch (err) {
      set({ error: 'Failed to load trip', loading: false });
    }
  },

  createTrip: async (data: CreateTripData) => {
    set({ loading: true, error: null });
    try {
      const newTrip = await tripApi.create(data);
      set((state) => ({ trips: [newTrip, ...state.trips], loading: false }));
      return newTrip;
    } catch (err) {
      set({ error: 'Failed to create trip', loading: false });
      throw err;
    }
  },

  deleteTrip: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await tripApi.delete(id);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to delete trip', loading: false });
    }
  },

  addActivity: async (tripId: string, activity: CreateActivityData) => {
    set({ loading: true, error: null });
    try {
      const newActivity = await tripApi.addActivity(tripId, activity);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId
            ? { ...t, activities: [...t.activities, newActivity], updatedAt: new Date().toISOString() }
            : t
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? { ...state.currentTrip, activities: [...state.currentTrip.activities, newActivity], updatedAt: new Date().toISOString() }
          : state.currentTrip,
        loading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to add activity', loading: false });
    }
  },

  updateActivity: async (tripId: string, activityId: string, updates: Partial<Activity>) => {
    set({ loading: true, error: null });
    try {
      const updated = await tripApi.updateActivity(tripId, activityId, updates);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                activities: t.activities.map((a) => (a.id === activityId ? updated : a)),
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? {
              ...state.currentTrip,
              activities: state.currentTrip.activities.map((a) => (a.id === activityId ? updated : a)),
              updatedAt: new Date().toISOString(),
            }
          : state.currentTrip,
        loading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to update activity', loading: false });
    }
  },

  deleteActivity: async (tripId: string, activityId: string) => {
    set({ loading: true, error: null });
    try {
      await tripApi.deleteActivity(tripId, activityId);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                activities: t.activities.filter((a) => a.id !== activityId),
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? {
              ...state.currentTrip,
              activities: state.currentTrip.activities.filter((a) => a.id !== activityId),
              updatedAt: new Date().toISOString(),
            }
          : state.currentTrip,
        loading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to delete activity', loading: false });
    }
  },

  reorderActivities: async (tripId: string, activityIds: string[], dayIndex: number) => {
    try {
      await tripApi.reorderActivities(tripId, activityIds, dayIndex);
      set((state) => {
        const updateTripActivities = (trip: Trip): Trip => {
          if (trip.id !== tripId) return trip;
          const dayActivities = trip.activities.filter((a) => a.dayIndex === dayIndex);
          const otherActivities = trip.activities.filter((a) => a.dayIndex !== dayIndex);
          const reordered = activityIds
            .map((id) => dayActivities.find((a) => a.id === id))
            .filter(Boolean) as Activity[];
          return { ...trip, activities: [...otherActivities, ...reordered], updatedAt: new Date().toISOString() };
        };
        return {
          trips: state.trips.map(updateTripActivities),
          currentTrip: state.currentTrip ? updateTripActivities(state.currentTrip) : null,
        };
      });
    } catch (err) {
      set({ error: 'Failed to reorder activities' });
    }
  },

  addLocation: async (tripId: string, location: CreateLocationData) => {
    set({ loading: true, error: null });
    try {
      const newLocation = await tripApi.addLocation(tripId, location);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId
            ? { ...t, locations: [...t.locations, newLocation], updatedAt: new Date().toISOString() }
            : t
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? { ...state.currentTrip, locations: [...state.currentTrip.locations, newLocation], updatedAt: new Date().toISOString() }
          : state.currentTrip,
        loading: false,
      }));
      return newLocation;
    } catch (err) {
      set({ error: 'Failed to add location', loading: false });
      throw err;
    }
  },

  deleteLocation: async (tripId: string, locationId: string) => {
    set({ loading: true, error: null });
    try {
      await tripApi.deleteLocation(tripId, locationId);
      set((state) => ({
        trips: state.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                locations: t.locations.filter((l) => l.id !== locationId),
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
        currentTrip: state.currentTrip?.id === tripId
          ? {
              ...state.currentTrip,
              locations: state.currentTrip.locations.filter((l) => l.id !== locationId),
              updatedAt: new Date().toISOString(),
            }
          : state.currentTrip,
        loading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to delete location', loading: false });
    }
  },

  setFilters: (filters: Partial<SearchFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  setHighlightedTrip: (id: string | null) => {
    set({ highlightedTripId: id });
  },

  setCurrentTrip: (trip: Trip | null) => {
    set({ currentTrip: trip });
  },

  getFilteredTrips: () => {
    const { trips, filters } = get();
    return trips.filter((trip) => {
      const matchesKeyword = !filters.keyword ||
        trip.destination.toLowerCase().includes(filters.keyword.toLowerCase());
      
      const matchesStartDate = !filters.startDate || trip.endDate >= filters.startDate;
      const matchesEndDate = !filters.endDate || trip.startDate <= filters.endDate;
      
      return matchesKeyword && matchesStartDate && matchesEndDate;
    });
  },
}));
