import { create } from 'zustand';
import { LeaderboardEntry } from '../types';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  loadEntries: () => void;
  addEntry: (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => void;
  getEntriesByTrack: (trackId: string) => LeaderboardEntry[];
  getPlayerStats: (playerName: string) => { totalRaces: number; bestTime: number | null };
}

const STORAGE_KEY = 'leaderboard';

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],

  loadEntries: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ entries: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load leaderboard from localStorage', e);
    }
  },

  addEntry: (entry) => {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const entries = [...get().entries, newEntry];
    set({ entries });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },

  getEntriesByTrack: (trackId) => {
    return get()
      .entries.filter((e) => e.trackId === trackId)
      .sort((a, b) => a.time - b.time);
  },

  getPlayerStats: (playerName) => {
    const playerEntries = get().entries.filter((e) => e.playerName === playerName);
    const totalRaces = playerEntries.length;
    const bestTime = totalRaces > 0 ? Math.min(...playerEntries.map((e) => e.time)) : null;
    return { totalRaces, bestTime };
  },
}));
