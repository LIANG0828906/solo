import { create } from 'zustand';
import type { Checkin, LatLng } from '@/types';

interface MapState {
  checkins: Checkin[];
  currentLocation: LatLng;
  zoom: number;
  loading: boolean;
  fetchCheckins: () => Promise<void>;
  addCheckin: (name: string, lat: number, lng: number) => Promise<void>;
  deleteCheckin: (id: string) => Promise<void>;
  setCurrentLocation: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  checkins: [],
  currentLocation: { lat: 39.9042, lng: 116.4074 },
  zoom: 13,
  loading: false,

  fetchCheckins: async () => {
    try {
      set({ loading: true });
      const res = await fetch('/api/checkins');
      const data = await res.json();
      if (data.success) {
        set({ checkins: data.data });
      }
    } catch (err) {
      console.error('获取签到点失败:', err);
    } finally {
      set({ loading: false });
    }
  },

  addCheckin: async (name, lat, lng) => {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lat, lng }),
      });
      const data = await res.json();
      if (data.success) {
        set((state) => ({ checkins: [...state.checkins, data.data] }));
      }
    } catch (err) {
      console.error('添加签到点失败:', err);
    }
  },

  deleteCheckin: async (id) => {
    try {
      const res = await fetch(`/api/checkin/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          checkins: state.checkins.filter((c) => c.id !== id),
        }));
      }
    } catch (err) {
      console.error('删除签到点失败:', err);
    }
  },

  setCurrentLocation: (lat, lng) => {
    set({ currentLocation: { lat, lng } });
  },

  setZoom: (zoom) => {
    set({ zoom });
  },
}));
