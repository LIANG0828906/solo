import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Item, ItemCategory } from '@/types';
import * as ItemService from './ItemService';

interface ItemState {
  items: Item[];
  currentItem: Item | null;
  loading: boolean;
  fetchItems: () => Promise<void>;
  fetchPublishedItems: () => Promise<void>;
  setCurrentItem: (item: Item | null) => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => Promise<void>;
  updateItem: (item: Item) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  publishItem: (id: string) => Promise<void>;
}

export const useItemStore = create<ItemState>((set) => ({
  items: [],
  currentItem: null,
  loading: false,

  fetchItems: async () => {
    set({ loading: true });
    const items = await ItemService.getAllItems();
    set({ items, loading: false });
  },

  fetchPublishedItems: async () => {
    set({ loading: true });
    const items = await ItemService.getPublishedItems();
    set({ items, loading: false });
  },

  setCurrentItem: (item) => {
    set({ currentItem: item });
  },

  addItem: async (item) => {
    const newItem: Item = {
      ...item,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    await ItemService.addItem(newItem);
    set((state) => ({ items: [...state.items, newItem] }));
  },

  updateItem: async (item) => {
    await ItemService.updateItem(item);
    set((state) => ({
      items: state.items.map((i) => (i.id === item.id ? item : i)),
    }));
  },

  deleteItem: async (id) => {
    await ItemService.deleteItem(id);
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  publishItem: async (id) => {
    await ItemService.publishItem(id);
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, isPublished: true, status: 'available' as const } : i
      ),
    }));
  },
}));
