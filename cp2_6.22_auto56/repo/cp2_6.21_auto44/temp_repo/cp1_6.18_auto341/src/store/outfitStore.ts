import { create } from 'zustand';
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { IOutfit } from '../types';

interface OutfitState {
  outfits: IOutfit[];
  loading: boolean;
  fetchOutfits: () => Promise<void>;
  fetchOutfitsByDate: (date: string) => Promise<IOutfit[]>;
  addOutfit: (outfit: Omit<IOutfit, 'id'>) => Promise<void>;
  updateOutfit: (id: string, outfit: Partial<IOutfit>) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  getOutfitsByMonth: (year: number, month: number) => Record<string, IOutfit[]>;
}

let dbInstance: IDBPDatabase | null = null;

const initDB = async () => {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB('WardrobeDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('outfits')) {
        const store = db.createObjectStore('outfits', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
    },
  });
  
  return dbInstance;
};

export const useOutfitStore = create<OutfitState>((set, get) => ({
  outfits: [],
  loading: false,

  fetchOutfits: async () => {
    try {
      set({ loading: true });
      const db = await initDB();
      const outfits = await db.getAll('outfits');
      set({ outfits, loading: false });
    } catch (error) {
      console.error('Failed to fetch outfits:', error);
      set({ loading: false });
    }
  },

  fetchOutfitsByDate: async (date: string) => {
    try {
      const db = await initDB();
      const index = db.transaction('outfits', 'readonly').store.index('date');
      const outfits = await index.getAll(date);
      return outfits;
    } catch (error) {
      console.error('Failed to fetch outfits by date:', error);
      return [];
    }
  },

  addOutfit: async (outfit) => {
    try {
      const db = await initDB();
      const newOutfit: IOutfit = {
        ...outfit,
        id: uuidv4(),
      };
      await db.add('outfits', newOutfit);
      set((state) => ({
        outfits: [...state.outfits, newOutfit],
      }));
    } catch (error) {
      console.error('Failed to add outfit:', error);
    }
  },

  updateOutfit: async (id: string, outfit: Partial<IOutfit>) => {
    try {
      const db = await initDB();
      const existing = await db.get('outfits', id);
      if (existing) {
        const updatedOutfit = { ...existing, ...outfit };
        await db.put('outfits', updatedOutfit);
        set((state) => ({
          outfits: state.outfits.map((o) =>
            o.id === id ? updatedOutfit : o
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to update outfit:', error);
    }
  },

  deleteOutfit: async (id: string) => {
    try {
      const db = await initDB();
      await db.delete('outfits', id);
      set((state) => ({
        outfits: state.outfits.filter((o) => o.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete outfit:', error);
    }
  },

  getOutfitsByMonth: (year: number, month: number) => {
    const { outfits } = get();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const result: Record<string, IOutfit[]> = {};

    for (const outfit of outfits) {
      if (outfit.date.startsWith(monthStr)) {
        if (!result[outfit.date]) {
          result[outfit.date] = [];
        }
        result[outfit.date].push(outfit);
      }
    }

    return result;
  },
}));
