import { create } from 'zustand';

export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  price: number;
  sales: number;
}

export interface Danmaku {
  id: string;
  nickname: string;
  avatar: string;
  content: string;
  timestamp: number;
}

export interface GiftRecord {
  id: string;
  nickname: string;
  avatar: string;
  gift: Gift;
  count: number;
  timestamp: number;
}

export interface RankingItem {
  id: string;
  nickname: string;
  avatar: string;
  totalCoins: number;
}

export type RankingPeriod = 'today' | 'week' | 'all';

interface DashboardState {
  gifts: Gift[];
  danmakus: Danmaku[];
  giftRecords: GiftRecord[];
  rankingData: RankingItem[];
  rankingPeriod: RankingPeriod;
  loading: boolean;
  giftModalVisible: boolean;
  editingGift: Gift | null;
  testModalVisible: boolean;

  setGifts: (gifts: Gift[]) => void;
  addGift: (gift: Gift) => void;
  updateGift: (gift: Gift) => void;
  deleteGift: (id: string) => void;
  
  addDanmaku: (danmaku: Danmaku) => void;
  
  addGiftRecord: (record: GiftRecord) => void;
  
  setRankingData: (data: RankingItem[]) => void;
  setRankingPeriod: (period: RankingPeriod) => void;
  
  setLoading: (loading: boolean) => void;
  setGiftModalVisible: (visible: boolean) => void;
  setEditingGift: (gift: Gift | null) => void;
  setTestModalVisible: (visible: boolean) => void;

  fetchGifts: () => Promise<void>;
  fetchRanking: () => Promise<void>;
  simulateDanmaku: (data: { nickname: string; content: string }) => Promise<void>;
  simulateGift: (data: { nickname: string; giftId: string; count: number }) => Promise<void>;
}

const API_BASE = '/api';

export const useDashboardStore = create<DashboardState>((set, get) => ({
  gifts: [],
  danmakus: [],
  giftRecords: [],
  rankingData: [],
  rankingPeriod: 'today',
  loading: false,
  giftModalVisible: false,
  editingGift: null,
  testModalVisible: false,

  setGifts: (gifts) => set({ gifts }),
  addGift: (gift) => set((state) => ({ gifts: [...state.gifts, gift] })),
  updateGift: (gift) => set((state) => ({
    gifts: state.gifts.map((g) => (g.id === gift.id ? gift : g)),
  })),
  deleteGift: (id) => set((state) => ({
    gifts: state.gifts.filter((g) => g.id !== id),
  })),

  addDanmaku: (danmaku) => set((state) => ({
    danmakus: [...state.danmakus, danmaku].slice(-100),
  })),

  addGiftRecord: (record) => set((state) => ({
    giftRecords: [...state.giftRecords, record].slice(-50),
  })),

  setRankingData: (rankingData) => set({ rankingData }),
  setRankingPeriod: (rankingPeriod) => set({ rankingPeriod }),

  setLoading: (loading) => set({ loading }),
  setGiftModalVisible: (giftModalVisible) => set({ giftModalVisible }),
  setEditingGift: (editingGift) => set({ editingGift }),
  setTestModalVisible: (testModalVisible) => set({ testModalVisible }),

  fetchGifts: async () => {
    try {
      const response = await fetch(`${API_BASE}/gifts`);
      const data = await response.json();
      set({ gifts: data });
    } catch (error) {
      console.error('Failed to fetch gifts:', error);
    }
  },

  fetchRanking: async () => {
    try {
      const period = get().rankingPeriod;
      const response = await fetch(`${API_BASE}/ranking?period=${period}`);
      const data = await response.json();
      set({ rankingData: data });
    } catch (error) {
      console.error('Failed to fetch ranking:', error);
    }
  },

  simulateDanmaku: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/simulate/danmaku`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      get().addDanmaku(result);
    } catch (error) {
      console.error('Failed to simulate danmaku:', error);
    }
  },

  simulateGift: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/simulate/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      get().addGiftRecord(result.record);
      get().updateGift(result.updatedGift);
      get().fetchRanking();
    } catch (error) {
      console.error('Failed to simulate gift:', error);
    }
  },
}));
