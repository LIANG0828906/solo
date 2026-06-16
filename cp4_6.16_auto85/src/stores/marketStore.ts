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
    const updated