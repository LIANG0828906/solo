import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Item, ItemCategory, ItemStatus } from '@/types';
import { generateAllMockData } from '@/utils/mock';

interface MarketState {
  items: Item[];
  searchQuery: string;
  selectedCategory: ItemCategory | 'all';
  isInitialized: boolean;
  initData: (items?: Item[]) => Promise<void>;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemStatus: (itemId: string, status: ItemStatus) => Promise<void>;
  updateItemStatusBatch: (ids: string[], status: ItemStatus) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ItemCategory | 'all') => void;
  getFilteredItems: () => Item[];
  getItemById: (itemId: string) => Item | undefined;
  getItemsByOwner: (ownerId: string) => Item[];
}

export const useMarketStore = create<MarketState>((set, get) => ({
  items: [],
  searchQuery: '',
  selectedCategory: 'all',
  isInitialized: false,

  initData: async (preloadItems) => {
    try {
      let items = await get<Item[]>('items');

      if (preloadItems && preloadItems.length > 0) {
        items = preloadItems;
        await set('items', items);
      } else if (!items || items.length === 0) {
        const mockData = generateAllMockData();
        items = mockData.items;
        await set('items', items);
      }

      set({ items: items || [], isInitialized: true });
    } catch (error) {
      console.error('Failed to init market data:', error);
      const mockData = generateAllMockData();
      set({ items: mockData.items, isInitialized: true });
    }
  },

  addItem: async (itemData) => {
    const newItem: Item = {
      ...itemData,
      id: uuidv4(),
      createdAt: Date.now(),
      status: 'available',
    };
    const updatedItems = [newItem, ...get().items];
    set({ items: updatedItems });
    try {
      await set('items', updatedItems);
    } catch (error) {
      console.error('Failed to save new item:', error);
    }
  },

  removeItem: async (itemId) => {
    const updatedItems = get().items.filter((i) => i.id !== itemId);
    set({ items: updatedItems });
    try {
      await set('items', updatedItems);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  },

  updateItemStatus: async (itemId, status) => {
    const updatedItems = get().items.map((i) =>
      i.id === itemId ? { ...i, status } : i
    );
    set({ items: updatedItems });
    try {
      await set('items', updatedItems);
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  },

  updateItemStatusBatch: async (ids, status) => {
    const idSet = new Set(ids);
    const updatedItems = get().items.map((i) =>
      idSet.has(i.id) ? { ...i, status } : i
    );
    set({ items: updatedItems });
    try {
      await set('items', updatedItems);
    } catch (error) {
      console.error('Failed to batch update item statuses:', error);
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  getFilteredItems: () => {
    const { items, searchQuery, selectedCategory } = get();
    return items.filter((item) => {
      if (item.status === 'exchanged') return false;
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desiredExchange.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  },

  getItemById: (itemId) => {
    return get().items.find((i) => i.id === itemId);
  },

  getItemsByOwner: (ownerId) => {
    return get().items.filter((i) => i.ownerId === ownerId);
  },
}));
