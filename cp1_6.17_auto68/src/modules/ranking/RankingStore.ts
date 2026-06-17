import { create } from 'zustand';
import type { RankingItem } from '../../types';

interface RankingStore {
  rankings: RankingItem[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  pollingInterval: number;
  fetchRankings: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  setPollingInterval: (ms: number) => void;
}

let pollingTimer: ReturnType<typeof setInterval> | null = null;

export const useRankingStore = create<RankingStore>((set, get) => ({
  rankings: [],
  loading: false,
  error: null,
  isRefreshing: false,
  pollingInterval: 5000,

  fetchRankings: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const response = await fetch('/api/ranking');
      if (!response.ok) throw new Error('Failed to fetch rankings');
      const rankings: RankingItem[] = await response.json();
      set({ rankings, loading: false, isRefreshing: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false, isRefreshing: false });
    }
  },

  startPolling: () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }
    
    void get().fetchRankings();
    
    pollingTimer = setInterval(() => {
      void get().fetchRankings();
    }, get().pollingInterval);
  },

  stopPolling: () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  },

  setPollingInterval: (ms) => {
    set({ pollingInterval: ms });
    if (pollingTimer) {
      get().startPolling();
    }
  }
}));
