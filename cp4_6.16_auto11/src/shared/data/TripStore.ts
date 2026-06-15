import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Trip, TripPage, Photo, MapMarker, MoodTagDef } from '../types';

interface TripStoreState {
  trips: Trip[];
  currentTripId: string | null;
  addTrip: (data: Omit<Trip, 'id' | 'pages' | 'createdAt' | 'updatedAt'>) => Trip;
  updateTrip: (id: string, data: Partial<Omit<Trip, 'id' | 'pages' | 'createdAt'>>) => void;
  deleteTrip: (id: string) => void;
  getTrip: (id: string) => Trip | undefined;
  addPage: (
    tripId: string,
    data: Omit<TripPage, 'id' | 'tripId' | 'photos' | 'markers' | 'pageNumber' | 'moodTags' | 'diaryContent'>
  ) => TripPage;
  updatePage: (tripId: string, pageId: string, data: Partial<Omit<TripPage, 'id' | 'tripId'>>) => void;
  deletePage: (tripId: string, pageId: string) => void;
  addPhotoToPage: (tripId: string, pageId: string, photo: Photo) => void;
  removePhotoFromPage: (tripId: string, pageId: string, photoId: string) => void;
  reorderPhotos: (tripId: string, pageId: string, photoIds: string[]) => void;
  addMarkerToPage: (
    tripId: string,
    pageId: string,
    data: Omit<MapMarker, 'id' | 'pageId' | 'createdAt' | 'address'>
  ) => MapMarker;
  removeMarkerFromPage: (tripId: string, pageId: string, markerId: string) => void;
  toggleMoodTag: (tripId: string, pageId: string, tag: MoodTagDef) => void;
  updateMarkerPhoto: (tripId: string, pageId: string, markerId: string, photoId: string | undefined) => void;
  setCurrentTripId: (id: string | null) => void;
}

export const useTripStore = create<TripStoreState>()(
  persist(
    (set, get) => ({
      trips: [],
      currentTripId: null,

      setCurrentTripId: (id) => set({ currentTripId: id }),

      addTrip: (data) => {
        const now = new Date().toISOString();
        const newTrip: Trip = {
          id: uuidv4(),
          ...data,
          pages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          trips: [...state.trips, newTrip],
          currentTripId: newTrip.id,
        }));
        return newTrip;
      },

      updateTrip: (id, data) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id ? { ...trip, ...data, updatedAt: new Date().toISOString() } : trip
          ),
        })),

      deleteTrip: (id) =>
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== id),
          currentTripId: state.currentTripId === id ? null : state.currentTripId,
        })),

      getTrip: (id) => get().trips.find((trip) => trip.id === id),

      addPage: (tripId, data) => {
        const trip = get().getTrip(tripId);
        const pageNumber = trip ? trip.pages.length + 1 : 1;
        const newPage: TripPage = {
          id: uuidv4(),
          tripId,
          ...data,
          diaryContent: `## 第 ${pageNumber} 天\n\n记录今天的美好时光...\n\n### 行程\n- \n\n### 感受\n- `,
          moodTags: [],
          photos: [],
          markers: [],
          pageNumber,
        };
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, pages: [...trip.pages, newPage], updatedAt: new Date().toISOString() }
              : trip
          ),
        }));
        return newPage;
      },

      updatePage: (tripId, pageId, data) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) =>
                    page.id === pageId ? { ...page, ...data } : page
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        })),

      deletePage: (tripId, pageId) =>
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip;
            const pages = trip.pages.filter((page) => page.id !== pageId);
            if (pages.length === 0) {
              const now = new Date().toISOString();
              const today = new Date().toISOString().split('T')[0];
              const initialPage: TripPage = {
                id: uuidv4(),
                tripId,
                title: '第 1 天',
                date: today,
                diaryContent: '## 第 1 天\n\n记录今天的美好时光...',
                moodTags: [],
                photos: [],
                markers: [],
                pageNumber: 1,
              };
              return { ...trip, pages: [initialPage], updatedAt: now };
            }
            return {
              ...trip,
              pages: pages.map((page, index) => ({ ...page, pageNumber: index + 1 })),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      addPhotoToPage: (tripId, pageId, photo) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) =>
                    page.id === pageId
                      ? { ...page, photos: [...page.photos, photo].slice(0, 6) }
                      : page
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        })),

      removePhotoFromPage: (tripId, pageId, photoId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) =>
                    page.id === pageId
                      ? {
                          ...page,
                          photos: page.photos.filter((p) => p.id !== photoId),
                          markers: page.markers.map((m) =>
                            m.photoId === photoId ? { ...m, photoId: undefined } : m
                          ),
                        }
                      : page
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        })),

      reorderPhotos: (tripId, pageId, photoIds) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) => {
                    if (page.id !== pageId) return page;
                    const photoMap = new Map(page.photos.map((p) => [p.id, p]));
                    const reorderedPhotos = photoIds
                      .map((id) => photoMap.get(id))
                      .filter(Boolean) as Photo[];
                    return { ...page, photos: reorderedPhotos };
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        })),

      addMarkerToPage: (tripId, pageId, data) => {
        const newMarker: MapMarker = {
          id: uuidv4(),
          pageId,
          address: `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
          ...data,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) =>
                    page.id === pageId ? { ...page, markers: [...page.markers, newMarker] } : page
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        }));
        return newMarker;
      },

      removeMarkerFromPage: (tripId, pageId, markerId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) =>
                    page.id === pageId
                      ? { ...page, markers: page.markers.filter((m) => m.id !== markerId) }
                      : page
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        })),

      toggleMoodTag: (tripId, pageId, tag) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) => {
                    if (page.id !== pageId) return page;
                    const hasTag = page.moodTags.some((t) => t.id === tag.id);
                    return {
                      ...page,
                      moodTags: hasTag
                        ? page.moodTags.filter((t) => t.id !== tag.id)
                        : [...page.moodTags, tag],
                    };
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        })),

      updateMarkerPhoto: (tripId, pageId, markerId, photoId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  pages: trip.pages.map((page) =>
                    page.id === pageId
                      ? {
                          ...page,
                          markers: page.markers.map((m) =>
                            m.id === markerId ? { ...m, photoId } : m
                          ),
                        }
                      : page
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : trip
          ),
        })),
    }),
    {
      name: 'travel-memoir-trips',
    }
  )
);
