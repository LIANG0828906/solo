import { create } from 'zustand';
import axios from 'axios';
import { Formula, Order, StatusLog, InventoryItem } from './types';

interface StoreState {
  formulas: Formula[];
  orders: Order[];
  inventory: InventoryItem[];
  loading: boolean;
  error: string | null;
  
  fetchFormulas: () => Promise<void>;
  fetchAvailableFormulas: () => Promise<void>;
  addFormula: (formula: Omit<Formula, 'id' | 'createdAt'>) => Promise<void>;
  updateFormula: (id: number, formula: Partial<Formula>) => Promise<void>;
  deleteFormula: (id: number) => Promise<void>;
  
  fetchOrders: () => Promise<void>;
  fetchOrderLogs: (orderId: number) => Promise<StatusLog[]>;
  addOrder: (order: any) => Promise<void>;
  updateOrderStatus: (id: number, status: string) => Promise<void>;
  
  fetchInventory: () => Promise<void>;
  fetchPurchaseSuggestions: () => Promise<InventoryItem[]>;
}

export const useStore = create<StoreState>((set) => ({
  formulas: [],
  orders: [],
  inventory: [],
  loading: false,
  error: null,

  fetchFormulas: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get('/api/formulas');
      set({ formulas: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAvailableFormulas: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get('/api/formulas/available');
      set({ formulas: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addFormula: async (formula) => {
    set({ loading: true });
    try {
      const { data } = await axios.post('/api/formulas', formula);
      set((state) => ({ formulas: [data, ...state.formulas], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateFormula: async (id, formula) => {
    set({ loading: true });
    try {
      const { data } = await axios.put(`/api/formulas/${id}`, formula);
      set((state) => ({
        formulas: state.formulas.map((f) => (f.id === id ? data : f)),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteFormula: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/formulas/${id}`);
      set((state) => ({
        formulas: state.formulas.filter((f) => f.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get('/api/orders');
      set({ orders: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchOrderLogs: async (orderId) => {
    try {
      const { data } = await axios.get(`/api/orders/${orderId}/logs`);
      return data;
    } catch (error: any) {
      set({ error: error.message });
      return [];
    }
  },

  addOrder: async (order) => {
    set({ loading: true });
    try {
      const { data } = await axios.post('/api/orders', order);
      set((state) => ({ orders: [data, ...state.orders], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { status });
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchInventory: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get('/api/inventory');
      set({ inventory: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPurchaseSuggestions: async () => {
    try {
      const { data } = await axios.get('/api/inventory/purchase-suggestions');
      return data;
    } catch (error: any) {
      set({ error: error.message });
      return [];
    }
  }
}));
