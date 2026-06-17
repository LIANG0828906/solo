import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Note, GeneratedCover, PlayHistoryItem } from '../types';

interface UserState {
  notes: Note[];
  favorites: string[];
  covers: GeneratedCover[];
  playHistory: PlayHistoryItem[];
  addNote: (recordId: string, recordTitle: string, content: string) => void;
  toggleFavorite: (recordId: string) => void;
  isFavorite: (recordId: string) => boolean;
  saveCover: (svg: string, style: string, keyword: string) => void;
  addToHistory: (recordId: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 20;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      notes: [],
      favorites: [],
      covers: [],
      playHistory: [],

      addNote: (recordId: string, recordTitle: string, content: string) => {
        const newNote: Note = {
          id: uuidv4(),
          recordId,
          recordTitle,
          content,
          timestamp: Date.now(),
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
      },

      toggleFavorite: (recordId: string) => {
        set((state) => ({
          favorites: state.favorites.includes(recordId)
            ? state.favorites.filter((id) => id !== recordId)
            : [...state.favorites, recordId],
        }));
      },

      isFavorite: (recordId: string) => {
        return get().favorites.includes(recordId);
      },

      saveCover: (svg: string, style: string, keyword: string) => {
        const newCover: GeneratedCover = {
          id: uuidv4(),
          svg,
          style,
          keyword,
          timestamp: Date.now(),
        };
        set((state) => ({
          covers: [newCover, ...state.covers],
        }));
      },

      addToHistory: (recordId: string) => {
        set((state) => {
          const filteredHistory = state.playHistory.filter(
            (item) => item.recordId !== recordId
          );
          const newHistory: PlayHistoryItem = {
            recordId,
            timestamp: Date.now(),
          };
          const updatedHistory = [newHistory, ...filteredHistory];
          return {
            playHistory: updatedHistory.slice(0, MAX_HISTORY_SIZE),
          };
        });
      },

      clearHistory: () => {
        set({ playHistory: [] });
      },
    }),
    {
      name: 'user-store',
    }
  )
);
