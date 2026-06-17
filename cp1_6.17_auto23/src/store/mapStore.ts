import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MapState, Checkin } from '../types';

const PHOTO_URLS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
];

function getRandomPhoto(): string {
  return PHOTO_URLS[Math.floor(Math.random() * PHOTO_URLS.length)];
}

export const useMapStore = create<MapState>((set) => ({
  checkins: [],
  userPosition: null,
  zoom: 13,
  loading: false,

  fetchCheckins: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/checkins');
      const data: Checkin[] = await response.json();
      set({ checkins: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch checkins:', error);
      set({ loading: false });
    }
  },

  addCheckin: async (checkinData) => {
    const newCheckin: Checkin = {
      id: uuidv4(),
      name: checkinData.name,
      lat: checkinData.lat,
      lng: checkinData.lng,
      createdAt: new Date().toISOString(),
      photo: getRandomPhoto(),
    };
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCheckin),
      });
      const saved = await response.json();
      set((state) => ({
        checkins: [...state.checkins, saved],
      }));
    } catch (error) {
      console.error('Failed to add checkin:', error);
    }
  },

  deleteCheckin: async (id) => {
    try {
      await fetch(`/api/checkin/${id}`, { method: 'DELETE' });
      set((state) => ({
        checkins: state.checkins.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete checkin:', error);
    }
  },

  setUserPosition: (pos) => set({ userPosition: pos }),
  setZoom: (zoom) => set({ zoom }),
}));
