import { create } from 'zustand';
import type { Item, HeatMapData, User, FilterParams } from '../types';
import {
  fetchItems,
  fetchHeatMapData,
  createItem as apiCreateItem,
  updateItem as apiUpdateItem,
  deleteItem as apiDeleteItem,
  fetchCurrentUser
} from '../api/fetchData';

interface MarketplaceState {
  items: Item[];
  heatMapData: HeatMapData[];
  currentUser: User | null;
  filters: FilterParams;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  setFilters: (filters: Partial<FilterParams>) => void;
  loadItems: () => Promise<void>;
  loadHeatMapData: () => Promise<void>;
  createItem: (data: Omit<Item, 'id' | 'createdAt'>) => Promise<Item>;
  updateItem: (id: string, data: Partial<Item>) => Promise<Item>;
  deleteItem: (id: string) => Promise<boolean>;
  setPage: (page: number) => void;
  loadCurrentUser: () => Promise<void>;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  items: [],
  heatMapData: [],
  currentUser: null,
  filters: {
    keyword: '',
    category: '全部',
    minPrice: 0,
    maxPrice: 10000
  },
  isLoading: false,
  currentPage: 1,
  pageSize: 20,

  setFilters: (filters) => {
    set({
      filters: { ...get().filters, ...filters },
      currentPage: 1
    });
  },

  loadItems: async () => {
    set({ isLoading: true });
    try {
      const items = await fetchItems(get().filters);
      set({ items });
    } finally {
      set({ isLoading: false });
    }
  },

  loadHeatMapData: async () => {
    const data = await fetchHeatMapData();
    set({ heatMapData: data });
  },

  createItem: async (data) => {
    const newItem = await apiCreateItem(data);
    await get().loadItems();
    return newItem;
  },

  updateItem: async (id, data) => {
    const updated = await apiUpdateItem(id, data);
    await get().loadItems();
    return updated;
  },

  deleteItem: async (id) => {
    const result = await apiDeleteItem(id);
    await get().loadItems();
    return result;
  },

  setPage: (page) => {
    set({ currentPage: page });
  },

  loadCurrentUser: async () => {
    const user = await fetchCurrentUser();
    set({ currentUser: user });
  }
}));
