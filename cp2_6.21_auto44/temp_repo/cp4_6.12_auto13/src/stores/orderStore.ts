import { create } from 'zustand';
import axios from 'axios';
import type {
  Order,
  Recipe,
  Material,
  DyeScheme,
  RestockSuggestion,
  OrderStatus,
} from '../types';

interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
}

interface OrderState {
  orders: Order[];
  recipes: Recipe[];
  materials: Material[];
  dyeSchemes: DyeScheme[];
  restockSuggestions: RestockSuggestion[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;

  fetchOrders: (page?: number) => Promise<void>;
  fetchRecipes: () => Promise<void>;
  fetchMaterials: () => Promise<void>;
  fetchDyeSchemes: () => Promise<void>;
  fetchRestockSuggestions: () => Promise<void>;
  createOrder: (data: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  createRecipe: (data: Partial<Recipe>) => Promise<void>;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  recipes: [],
  materials: [],
  dyeSchemes: [],
  restockSuggestions: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,

  fetchOrders: async (page?: number) => {
    set({ loading: true, error: null });
    try {
      const pageNum = page ?? get().currentPage;
      const res = await axios.get<PaginatedResponse<Order>>(`/api/orders?page=${pageNum}&limit=10`);
      set({
        orders: res.data.data,
        currentPage: res.data.currentPage,
        totalPages: res.data.totalPages,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchRecipes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<Recipe[]>('/api/recipes');
      set({ recipes: res.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMaterials: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<Material[]>('/api/materials');
      set({ materials: res.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchDyeSchemes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<DyeScheme[]>('/api/dye-schemes');
      set({ dyeSchemes: res.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchRestockSuggestions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get<RestockSuggestion[]>('/api/restock-suggestions');
      set({ restockSuggestions: res.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createOrder: async (data: Partial<Order>) => {
    set({ loading: true, error: null });
    try {
      await axios.post('/api/orders', data);
      await get().fetchOrders();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateOrderStatus: async (id: string, status: OrderStatus) => {
    set({ loading: true, error: null });
    try {
      await axios.put(`/api/orders/${id}`, { status });
      await get().fetchOrders();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createRecipe: async (data: Partial<Recipe>) => {
    set({ loading: true, error: null });
    try {
      await axios.post('/api/recipes', data);
      await get().fetchRecipes();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateMaterial: async (id: string, data: Partial<Material>) => {
    set({ loading: true, error: null });
    try {
      await axios.put(`/api/materials/${id}`, data);
      await get().fetchMaterials();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
