import { create } from 'zustand';
import type { Checkin, MapPosition } from '../types';

interface MapState {
  checkins: Checkin[];
  currentPosition: MapPosition;
  userLocation: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  fetchCheckins: () => Promise<void>;
  addCheckin: (name: string, lat: number, lng: number) => Promise<Checkin | null>;
  deleteCheckin: (id: string) => Promise<void>;
  setCurrentPosition: (position: MapPosition) => void;
  setUserLocation: (location: { lat: number; lng: number }) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  checkins: [],
  currentPosition: {
    lat: 39.9042,
    lng: 116.4074,
    zoom: 13,
  },
  userLocation: null,
  loading: false,
  error: null,

  fetchCheckins: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/checkins');
      if (!response.ok) throw new Error('获取签到点失败');
      const data = await response.json();
      set({ checkins: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addCheckin: async (name: string, lat: number, lng: number) => {
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, lat, lng }),
      });
      if (!response.ok) throw new Error('添加签到点失败');
      const newCheckin = await response.json();
      set((state) => ({
        checkins: [newCheckin, ...state.checkins],
      }));
      return newCheckin;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  deleteCheckin: async (id: string) => {
    try {
      const response = await fetch(`/api/checkin/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除签到点失败');
      set((state) => ({
        checkins: state.checkins.filter((c) => c.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setCurrentPosition: (position: MapPosition) => {
    set({ currentPosition: position });
  },

  setUserLocation: (location: { lat: number; lng: number }) => {
    set({
      userLocation: location,
      currentPosition: {
        lat: location.lat,
        lng: location.lng,
        zoom: 13,
      },
    });
  },
}));
