import { create } from 'zustand';
import { TechDebtItem, ItemStatus } from '@/types';

interface TechDebtState {
  items: TechDebtItem[];
  selectedFile: string | null;
  isLoading: boolean;
  showExportModal: boolean;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<TechDebtItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<TechDebtItem>) => Promise<void>;
  updateItemStatus: (id: string, status: ItemStatus) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (status: ItemStatus, newOrder: TechDebtItem[]) => void;
  setSelectedFile: (filePath: string | null) => void;
  setShowExportModal: (show: boolean) => void;
}

const API_BASE = '/api';

export const useTechDebtStore = create<TechDebtState>((set, get) => ({
  items: [],
  selectedFile: null,
  isLoading: false,
  showExportModal: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE}/items`);
      const items = await response.json();
      set({ items });
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (itemData) => {
    try {
      const response = await fetch(`${API_BASE}/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      const newItem = await response.json();
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  },

  updateItem: async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/item/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedItem = await response.json();
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
      }));
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  },

  updateItemStatus: async (id, status) => {
    await get().updateItem(id, { status });
  },

  deleteItem: async (id) => {
    try {
      await fetch(`${API_BASE}/item/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  },

  reorderItems: (status, newOrder) => {
    set((state) => {
      const otherItems = state.items.filter((item) => item.status !== status);
      return { items: [...otherItems, ...newOrder] };
    });
  },

  setSelectedFile: (filePath) => set({ selectedFile: filePath }),
  setShowExportModal: (show) => set({ showExportModal: show }),
}));
