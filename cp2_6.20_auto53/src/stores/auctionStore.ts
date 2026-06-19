import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type {
  AuctionItem,
  BidRecord,
  FavoriteItem,
  FilterState,
  Category,
} from '@/types';
import {
  generateAuctionItems,
  generateInitialBidHistory,
  generateInitialFavorites,
} from '@/utils/mockData';

interface AuctionState {
  items: AuctionItem[];
  loading: boolean;
  filter: FilterState;
  favorites: FavoriteItem[];
  bidHistory: BidRecord[];
  notifications: number;
  currentUser: string;
  initialized: boolean;

  fetchItems: () => Promise<void>;
  setFilter: (filter: Partial<FilterState>) => void;
  placeBid: (itemId: string, amount: number) => { ok: boolean; message?: string };
  toggleFavorite: (itemId: string) => void;
  reorderFavorites: (fromOrder: number, toOrder: number) => void;
  clearNotifications: () => void;
  isFavorite: (itemId: string) => boolean;
  simulateOtherBid: () => void;
}

export const useAuctionStore = create<AuctionState>((set, get) => ({
  items: [],
  loading: true,
  filter: {
    category: 'all',
    minPrice: 0,
    maxPrice: 999999999,
  },
  favorites: [],
  bidHistory: [],
  notifications: 0,
  currentUser: '尊贵的藏家',
  initialized: false,

  fetchItems: async () => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 500));
    const items = generateAuctionItems();
    const bidHistory = generateInitialBidHistory();
    const favorites = generateInitialFavorites(items);
    set({
      items,
      bidHistory,
      favorites,
      loading: false,
      initialized: true,
    });
  },

  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }));
  },

  placeBid: (itemId, amount) => {
    const state = get();
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return { ok: false, message: '拍品不存在' };
    if (amount <= item.currentPrice) {
      return {
        ok: false,
        message: `出价必须高于当前价 ¥${item.currentPrice.toLocaleString('zh-CN')}`,
      };
    }

    const newBid: BidRecord = {
      id: uuidv4(),
      itemId,
      itemName: item.name,
      amount,
      time: dayjs().toISOString(),
      status: 'leading',
    };

    set((prev) => ({
      items: prev.items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              currentPrice: amount,
              bidCount: it.bidCount + 1,
              highestBidder: prev.currentUser,
            }
          : it,
      ),
      bidHistory: [newBid, ...prev.bidHistory],
    }));

    setTimeout(() => {
      get().simulateOtherBid();
    }, 4000 + Math.random() * 10000);

    return { ok: true };
  },

  toggleFavorite: (itemId) => {
    set((prev) => {
      const exists = prev.favorites.find((f) => f.itemId === itemId);
      if (exists) {
        return {
          favorites: prev.favorites.filter((f) => f.itemId !== itemId),
        };
      }
      const maxOrder = prev.favorites.reduce(
        (m, f) => Math.max(m, f.order),
        -1,
      );
      return {
        favorites: [
          ...prev.favorites,
          {
            id: uuidv4(),
            itemId,
            order: maxOrder + 1,
            addedAt: dayjs().toISOString(),
          },
        ],
      };
    });
  },

  reorderFavorites: (fromOrder, toOrder) => {
    set((prev) => {
      const sorted = [...prev.favorites].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(fromOrder, 1);
      if (!moved) return prev;
      sorted.splice(toOrder, 0, moved);
      return {
        favorites: sorted.map((f, idx) => ({ ...f, order: idx })),
      };
    });
  },

  clearNotifications: () => {
    set({ notifications: 0 });
  },

  isFavorite: (itemId) => {
    return get().favorites.some((f) => f.itemId === itemId);
  },

  simulateOtherBid: () => {
    const state = get();
    const myLeadingBids = state.bidHistory.filter(
      (b) =>
        b.status === 'leading' &&
        state.items.find((it) => it.id === b.itemId)?.highestBidder ===
          state.currentUser,
    );
    if (myLeadingBids.length === 0) return;

    const targetBid =
      myLeadingBids[Math.floor(Math.random() * myLeadingBids.length)];
    const targetItem = state.items.find((i) => i.id === targetBid.itemId);
    if (!targetItem) return;

    const overbidAmount = Math.floor(
      targetItem.currentPrice * (1.03 + Math.random() * 0.08),
    );
    const fakeNames = ['藏家L先生', '神秘买家88', '欧洲古董商', '亚洲艺术基金'];

    set((prev) => ({
      items: prev.items.map((it) =>
        it.id === targetItem.id
          ? {
              ...it,
              currentPrice: overbidAmount,
              bidCount: it.bidCount + 1,
              highestBidder:
                fakeNames[Math.floor(Math.random() * fakeNames.length)],
            }
          : it,
      ),
      bidHistory: prev.bidHistory.map((b) =>
        b.id === targetBid.id ? { ...b, status: 'outbid' as const } : b,
      ),
      notifications: prev.notifications + 1,
    }));
  },
}));

export function selectFilteredItems(state: AuctionState): AuctionItem[] {
  return state.items.filter((item) => {
    if (
      state.filter.category !== 'all' &&
      item.category !== (state.filter.category as Category)
    ) {
      return false;
    }
    if (item.currentPrice < state.filter.minPrice) return false;
    if (item.currentPrice > state.filter.maxPrice) return false;
    return true;
  });
}
