import { create } from 'zustand';
import { OrderItem } from '../types';

interface CartState {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  getCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
  clearCart: () => set({ items: [] }),
  getCount: () => get().items.length,
}));

interface OrderConfirmState {
  orderNo: string | null;
  items: OrderItem[] | null;
  setOrder: (orderNo: string, items: OrderItem[]) => void;
  clear: () => void;
}

export const useOrderConfirmStore = create<OrderConfirmState>((set) => ({
  orderNo: null,
  items: null,
  setOrder: (orderNo, items) => set({ orderNo, items }),
  clear: () => set({ orderNo: null, items: null }),
}));
