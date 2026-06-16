import { create } from 'zustand';
import {
  Item,
  Offer,
  User,
  CreateItemInput,
  CreateOfferInput,
  ItemStatus,
  createItem,
  getAvailableItems,
  searchItems as searchItemsModel,
  getItemById,
  createOffer,
  getOffersByItem,
  acceptOffer as acceptOfferModel,
  rejectOffer as rejectOfferModel,
  countUsers,
  countItems,
  getTodaySwappedCount,
  countUserItems,
  countUserPendingOffers,
  countUserSwapped,
  getItemsBySeller,
  getOffersBySeller,
  getUserTransactions,
  getOffersByBuyer,
} from './models';
import { useAuthStore } from '../auth/store';

export interface PlatformStats {
  totalItems: number;
  totalUsers: number;
  todayTrades: number;
}

export interface UserStats {
  myItems: number;
  pendingOffers: number;
  completedTrades: number;
}

export interface Transaction {
  id: string;
  item: Item;
  offer?: Offer;
  counterpart: User;
  role: 'buyer' | 'seller';
  date: string;
}

interface TradeState {
  items: Item[];
  currentItem: Item | null;
  currentItemOffers: Offer[];
  loading: boolean;
  error: string | null;
  platformStats: PlatformStats;
  userStats: UserStats;
  myItems: Item[];
  myReceivedOffers: Offer[];
  myTransactions: Transaction[];
  fetchItems: (excludeSelf?: boolean) => Promise<void>;
  searchItems: (keyword: string, excludeSelf?: boolean) => Promise<void>;
  fetchItemById: (id: string) => Promise<Item | null>;
  fetchItemOffers: (itemId: string) => Promise<void>;
  createNewItem: (input: Omit<CreateItemInput, 'sellerId'>) => Promise<Item>;
  makeOffer: (input: Omit<CreateOfferInput, 'buyerId'>) => Promise<Offer>;
  acceptOffer: (offerId: string) => Promise<void>;
  rejectOffer: (offerId: string) => Promise<void>;
  loadPlatformStats: () => Promise<void>;
  loadUserStats: (userId: string) => Promise<void>;
  loadMyItems: (userId: string) => Promise<void>;
  loadMyReceivedOffers: (userId: string) => Promise<void>;
  loadMyTransactions: (userId: string) => Promise<void>;
  clearCurrentItem: () => void;
  clearError: () => void;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  items: [],
  currentItem: null,
  currentItemOffers: [],
  loading: false,
  error: null,
  platformStats: { totalItems: 0, totalUsers: 0, todayTrades: 0 },
  userStats: { myItems: 0, pendingOffers: 0, completedTrades: 0 },
  myItems: [],
  myReceivedOffers: [],
  myTransactions: [],

  fetchItems: async (excludeSelf = true) => {
    set({ loading: true, error: null });
    try {
      const userId = excludeSelf ? useAuthStore.getState().currentUser?.id : undefined;
      const items = await getAvailableItems(userId);
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  searchItems: async (keyword: string, excludeSelf = true) => {
    set({ loading: true, error: null });
    try {
      const userId = excludeSelf ? useAuthStore.getState().currentUser?.id : undefined;
      const items = await searchItemsModel(keyword, userId);
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchItemById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const item = (await getItemById(id)) || null;
      set({ currentItem: item, loading: false });
      if (item) {
        const offers = await getOffersByItem(id);
        set({ currentItemOffers: offers });
      }
      return item;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  fetchItemOffers: async (itemId: string) => {
    try {
      const offers = await getOffersByItem(itemId);
      set({ currentItemOffers: offers });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  createNewItem: async (input) => {
    set({ loading: true, error: null });
    const sellerId = useAuthStore.getState().currentUser?.id;
    if (!sellerId) throw new Error('请先登录');
    try {
      const item = await createItem({ ...input, sellerId });
      set({ loading: false });
      return item;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  makeOffer: async (input) => {
    set({ loading: true, error: null });
    const buyerId = useAuthStore.getState().currentUser?.id;
    if (!buyerId) throw new Error('请先登录');
    try {
      const offer = await createOffer({ ...input, buyerId });
      await get().fetchItemById(input.itemId);
      set({ loading: false });
      return offer;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  acceptOffer: async (offerId: string) => {
    set({ loading: true, error: null });
    try {
      const result = await acceptOfferModel(offerId);
      const { buyer, seller } = result;
      const curUser = useAuthStore.getState().currentUser;
      if (curUser?.id === buyer.id) {
        useAuthStore.getState().setCurrentUser(buyer);
      } else if (curUser?.id === seller.id) {
        useAuthStore.getState().setCurrentUser(seller);
      }
      if (get().currentItem) {
        await get().fetchItemById(get().currentItem!.id);
      }
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  rejectOffer: async (offerId: string) => {
    set({ loading: true, error: null });
    try {
      await rejectOfferModel(offerId);
      if (get().currentItem) {
        await get().fetchItemById(get().currentItem!.id);
      }
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  loadPlatformStats: async () => {
    try {
      const [totalItems, totalUsers, todayTrades] = await Promise.all([
        countItems(),
        countUsers(),
        getTodaySwappedCount(),
      ]);
      set({ platformStats: { totalItems, totalUsers, todayTrades } });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadUserStats: async (userId: string) => {
    try {
      const [myItems, pendingOffers, completedTrades] = await Promise.all([
        countUserItems(userId),
        countUserPendingOffers(userId),
        countUserSwapped(userId),
      ]);
      set({ userStats: { myItems, pendingOffers, completedTrades } });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadMyItems: async (userId: string) => {
    try {
      const items = await getItemsBySeller(userId);
      set({ myItems: items });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadMyReceivedOffers: async (userId: string) => {
    try {
      const offers = await getOffersBySeller(userId);
      set({ myReceivedOffers: offers });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadMyTransactions: async (userId: string) => {
    try {
      const transactions = await getUserTransactions(userId);
      set({ myTransactions: transactions });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  clearCurrentItem: () => set({ currentItem: null, currentItemOffers: [] }),
  clearError: () => set({ error: null }),
}));
