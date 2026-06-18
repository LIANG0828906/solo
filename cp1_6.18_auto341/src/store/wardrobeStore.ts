import { create } from 'zustand';
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { IItem, IWardrobeStats } from '../types';

interface WardrobeState {
  items: IItem[];
  loading: boolean;
  db: IDBPDatabase | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<IItem, 'id' | 'wearFrequency'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<IItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  incrementWearFrequency: (id: string) => Promise<void>;
  getStats: () => IWardrobeStats;
  initDB: () => Promise<void>;
}

let dbInstance: IDBPDatabase | null = null;

const initDB = async (): Promise<IDBPDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('WardrobeDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
};

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  loading: false,
  db: null,

  initDB: async () => {
    try {
      const db = await initDB();
      set({ db });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  },

  fetchItems: async () => {
    set({ loading: true });
    try {
      const db = await initDB();
      const items = await db.getAll('items');
      set({ items, loading: false });
    } catch (error) {
      console.error('Failed to fetch items:', error);
      set({ loading: false });
      throw error;
    }
  },

  addItem: async (itemData) => {
    set({ loading: true });
    try {
      const db = await initDB();
      const newItem: IItem = {
        ...itemData,
        id: uuidv4(),
        wearFrequency: {
          weekly: 0,
          monthly: 0,
          yearly: 0,
          total: 0,
        },
      };
      await db.add('items', newItem);
      set((state) => ({
        items: [...state.items, newItem],
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to add item:', error);
      set({ loading: false });
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    set({ loading: true });
    try {
      const db = await initDB();
      const existingItem = await db.get('items', id);
      if (!existingItem) {
        throw new Error(`Item with id ${id} not found`);
      }
      const updatedItem = { ...existingItem, ...updates };
      await db.put('items', updatedItem);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updatedItem : item
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to update item:', error);
      set({ loading: false });
      throw error;
    }
  },

  deleteItem: async (id) => {
    set({ loading: true });
    try {
      const db = await initDB();
      await db.delete('items', id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete item:', error);
      set({ loading: false });
      throw error;
    }
  },

  incrementWearFrequency: async (id) => {
    set({ loading: true });
    try {
      const db = await initDB();
      const existingItem = await db.get('items', id);
      if (!existingItem) {
        throw new Error(`Item with id ${id} not found`);
      }
      const updatedItem: IItem = {
        ...existingItem,
        wearFrequency: {
          weekly: existingItem.wearFrequency.weekly + 1,
          monthly: existingItem.wearFrequency.monthly + 1,
          yearly: existingItem.wearFrequency.yearly + 1,
          total: existingItem.wearFrequency.total + 1,
        },
      };
      await db.put('items', updatedItem);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updatedItem : item
        ),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to increment wear frequency:', error);
      set({ loading: false });
      throw error;
    }
  },

  getStats: () => {
    const { items } = get();
    const totalSpent = items.reduce((sum, item) => sum + item.price, 0);
    const itemCount = items.length;
    const averagePrice = itemCount > 0 ? totalSpent / itemCount : 0;

    return {
      totalSpent,
      itemCount,
      averagePrice,
    };
  },
}));
