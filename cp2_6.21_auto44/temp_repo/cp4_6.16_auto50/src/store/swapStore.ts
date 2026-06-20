import { create } from 'zustand';
import { Item, SwapEvent, SwapChain, CommunityStats, Member } from '@/types';
import { db, generateSampleData } from '@/utils/db';
import { generateId, formatMonth } from '@/utils/helpers';

interface SwapState {
  items: Item[];
  swapEvents: SwapEvent[];
  members: Member[];
  isLoading: boolean;
  isAdmin: boolean;
  searchKeyword: string;
  selectedTag: string | null;
  initialize: () => Promise<void>;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<void>;
  recordSwap: (event: Omit<SwapEvent, 'id'>) => Promise<SwapEvent>;
  getItemChain: (itemId: string) => Promise<SwapChain | null>;
  getStats: () => Promise<CommunityStats>;
  filterItems: () => Item[];
  setSearchKeyword: (keyword: string) => void;
  setSelectedTag: (tag: string | null) => void;
  toggleAdmin: () => void;
  getLatestSwaps: (limit?: number) => SwapEvent[];
}

export const useSwapStore = create<SwapState>((set, get) => ({
  items: [],
  swapEvents: [],
  members: [],
  isLoading: true,
  isAdmin: false,
  searchKeyword: '',
  selectedTag: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const isInitialized = await db.isInitialized();
      if (!isInitialized) {
        await generateSampleData();
      }
      const [items, events, members] = await Promise.all([
        db.getItems(),
        db.getSwapEvents(),
        db.getMembers(),
      ]);
      set({
        items,
        swapEvents: events,
        members,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false });
    }
  },

  addItem: async (itemData) => {
    const now = new Date();
    const newItem: Item = {
      ...itemData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const items = [...get().items, newItem];
    await db.saveItems(items);
    set({ items });
    return newItem;
  },

  updateItem: async (id, updates) => {
    const items = get().items;
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    const updatedItem: Item = {
      ...items[index],
      ...updates,
      updatedAt: new Date(),
    };
    const newItems = [...items];
    newItems[index] = updatedItem;
    await db.saveItems(newItems);
    set({ items: newItems });
    return updatedItem;
  },

  deleteItem: async (id) => {
    const items = get().items.filter(item => item.id !== id);
    const swapEvents = get().swapEvents.filter(event => event.itemId !== id);
    await Promise.all([
      db.saveItems(items),
      db.saveSwapEvents(swapEvents),
    ]);
    set({ items, swapEvents });
  },

  recordSwap: async (eventData) => {
    const newEvent: SwapEvent = {
      ...eventData,
      id: generateId(),
    };
    const swapEvents = [newEvent, ...get().swapEvents];
    
    const items = get().items.map(item => {
      if (item.id === eventData.itemId) {
        return {
          ...item,
          currentHolder: eventData.toHolder,
          holderAvatar: eventData.toAvatar,
          updatedAt: new Date(),
        };
      }
      return item;
    });
    
    await Promise.all([
      db.saveSwapEvents(swapEvents),
      db.saveItems(items),
    ]);
    set({ swapEvents, items });
    return newEvent;
  },

  getItemChain: async (itemId) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item) return null;
    
    const events = get().swapEvents
      .filter(e => e.itemId === itemId)
      .sort((a, b) => a.swapDate.getTime() - b.swapDate.getTime());
    
    return { item, events };
  },

  getStats: async () => {
    const { items, swapEvents, members } = get();
    const activeItems = items.filter(i => i.status === 'active').length;
    const totalSwaps = swapEvents.length;
    const participants = members.length;

    const monthlyData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = formatMonth(date);
      monthlyData[monthKey] = 0;
    }

    swapEvents.forEach(event => {
      const monthKey = formatMonth(event.swapDate);
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    const monthlyTrend = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));

    return {
      totalSwaps,
      activeItems,
      participants,
      monthlyTrend,
    };
  },

  filterItems: () => {
    const { items, searchKeyword, selectedTag } = get();
    return items.filter(item => {
      const matchesKeyword = searchKeyword === '' || 
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.description.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesTag = selectedTag === null || item.tags.includes(selectedTag);
      return matchesKeyword && matchesTag;
    });
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  toggleAdmin: () => set(state => ({ isAdmin: !state.isAdmin })),

  getLatestSwaps: (limit = 10) => {
    return get().swapEvents
      .sort((a, b) => b.swapDate.getTime() - a.swapDate.getTime())
      .slice(0, limit);
  },
}));
