import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TravelogState, Travelog } from '../types';
import { useMapStore } from './mapStore';

export const useTravelogStore = create<TravelogState>((set) => ({
  travelogs: [],
  favorites: [],
  loading: false,

  fetchTravelogs: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/travelogs');
      const data: Travelog[] = await response.json();
      set({ travelogs: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch travelogs:', error);
      set({ loading: false });
    }
  },

  addTravelog: async (travelogData) => {
    const checkins = useMapStore.getState().checkins;
    const checkinList = travelogData.checkinIds
      .map((id) => checkins.find((c) => c.id === id))
      .filter(Boolean);
    const coverPhoto = checkinList[0]?.photo || '';

    const newTravelog: Travelog = {
      id: uuidv4(),
      title: travelogData.title,
      content: travelogData.content,
      checkinIds: travelogData.checkinIds,
      coverPhoto,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/travelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTravelog),
      });
      const saved = await response.json();
      set((state) => ({
        travelogs: [...state.travelogs, saved],
      }));
    } catch (error) {
      console.error('Failed to add travelog:', error);
    }
  },

  toggleFavorite: (travelogId) => {
    set((state) => {
      const exists = state.favorites.includes(travelogId);
      return {
        favorites: exists
          ? state.favorites.filter((id) => id !== travelogId)
          : [...state.favorites, travelogId],
      };
    });
  },
}));
