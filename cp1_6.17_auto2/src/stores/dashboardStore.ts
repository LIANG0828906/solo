import { create } from 'zustand';
import type { Gift, Danmaku, GiftRecord, RankingItem, RankingPeriod } from '../types';

interface DashboardState {
  gifts: Gift[];
  danmakus: Danmaku[];
  giftRecords: GiftRecord[];
  ranking: RankingItem[];
  rankingPeriod: RankingPeriod;
  loading: boolean;
  sidebarVisible: boolean;
  editingGift: Gift | null;

  fetchGifts: () => Promise<void>;
  fetchDanmakus: () => Promise<void>;
  fetchGiftRecords: () => Promise<void>;
  fetchRanking: (period?: RankingPeriod) => Promise<void>;
  setRankingPeriod: (period: RankingPeriod) => void;
  addGift: (gift: Omit<Gift, 'id' | 'sales'>) => Promise<void>;
  updateGift: (id: string, gift: Partial<Gift>) => Promise<void>;
  deleteGift: (id: string) => Promise<void>;
  sendDanmaku: (data: { nickname: string; content: string }) => Promise<Danmaku | null>;
  sendGift: (data: { nickname: string; giftId: string; quantity: number }) => Promise<GiftRecord | null>;
  addDanmakuOptimistic: (danmaku: Danmaku) => void;
  addGiftRecordOptimistic: (record: GiftRecord) => void;
  openSidebar: (gift?: Gift) => void;
  closeSidebar: () => void;
  startAutoRefresh: () => () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  gifts: [],
  danmakus: [],
  giftRecords: [],
  ranking: [],
  rankingPeriod: 'today',
  loading: false,
  sidebarVisible: false,
  editingGift: null,

  fetchGifts: async () => {
    try {
      const res = await fetch('/api/gifts');
      const data = await res.json();
      set({ gifts: data });
    } catch (error) {
      console.error('Failed to fetch gifts:', error);
    }
  },

  fetchDanmakus: async () => {
    try {
      const res = await fetch('/api/danmakus');
      const data = await res.json();
      set({ danmakus: data });
    } catch (error) {
      console.error('Failed to fetch danmakus:', error);
    }
  },

  fetchGiftRecords: async () => {
    try {
      const res = await fetch('/api/gift-records');
      const data = await res.json();
      set({ giftRecords: data });
    } catch (error) {
      console.error('Failed to fetch gift records:', error);
    }
  },

  fetchRanking: async (period) => {
    const currentPeriod = period || get().rankingPeriod;
    set({ loading: true });
    try {
      const res = await fetch(`/api/ranking?period=${currentPeriod}`);
      const data = await res.json();
      set({ ranking: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch ranking:', error);
      set({ loading: false });
    }
  },

  setRankingPeriod: (period) => {
    set({ rankingPeriod: period });
    get().fetchRanking(period);
  },

  addGift: async (gift) => {
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gift),
      });
      const data = await res.json();
      set((state) => ({ gifts: [...state.gifts, data] }));
    } catch (error) {
      console.error('Failed to add gift:', error);
    }
  },

  updateGift: async (id, gift) => {
    try {
      const res = await fetch(`/api/gifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gift),
      });
      const data = await res.json();
      set((state) => ({
        gifts: state.gifts.map((g) => (g.id === id ? data : g)),
      }));
    } catch (error) {
      console.error('Failed to update gift:', error);
    }
  },

  deleteGift: async (id) => {
    try {
      await fetch(`/api/gifts/${id}`, { method: 'DELETE' });
      set((state) => ({
        gifts: state.gifts.filter((g) => g.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete gift:', error);
    }
  },

  sendDanmaku: async (data) => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'danmaku', ...data }),
      });
      const result = await res.json();
      return result;
    } catch (error) {
      console.error('Failed to send danmaku:', error);
      return null;
    }
  },

  sendGift: async (data) => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gift', ...data }),
      });
      const result = await res.json();
      return result;
    } catch (error) {
      console.error('Failed to send gift:', error);
      return null;
    }
  },

  addDanmakuOptimistic: (danmaku) => {
    set((state) => ({
      danmakus: [...state.danmakus.slice(-49), danmaku],
    }));
  },

  addGiftRecordOptimistic: (record) => {
    set((state) => ({
      giftRecords: [...state.giftRecords.slice(-19), record],
    }));
  },

  openSidebar: (gift) => {
    set({ sidebarVisible: true, editingGift: gift || null });
  },

  closeSidebar: () => {
    set({ sidebarVisible: false, editingGift: null });
  },

  startAutoRefresh: () => {
    const interval = setInterval(() => {
      get().fetchRanking();
      get().fetchDanmakus();
      get().fetchGiftRecords();
    }, 5000);
    return () => clearInterval(interval);
  },
}));
