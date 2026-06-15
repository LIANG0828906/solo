import { create } from 'zustand';
import type { Flower, BouquetItem, Order } from '@/types';

interface FlowerStore {
  flowers: Flower[];
  bouquetItems: BouquetItem[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  setFlowers: (flowers: Flower[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addBouquetItem: (flower: Flower) => void;
  removeBouquetItem: (flowerId: string) => void;
  updateBouquetQuantity: (flowerId: string, quantity: number) => void;
  clearBouquet: () => void;
  setCurrentOrder: (order: Order | null) => void;
  getTotalPrice: () => number;
  getBouquetItem: (flowerId: string) => BouquetItem | undefined;
}

export const useFlowerStore = create<FlowerStore>((set, get) => ({
  flowers: [],
  bouquetItems: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  setFlowers: (flowers) => set({ flowers }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addBouquetItem: (flower) => {
    const { bouquetItems, flowers } = get();
    const existing = bouquetItems.find((item) => item.flowerId === flower.id);
    if (existing) {
      const newQuantity = existing.quantity + 1;
      if (newQuantity > flower.stock) return;
      set({
        bouquetItems: bouquetItems.map((item) =>
          item.flowerId === flower.id ? { ...item, quantity: newQuantity } : item
        ),
      });
    } else {
      if (flower.stock <= 0) return;
      set({
        bouquetItems: [...bouquetItems, { flowerId: flower.id, quantity: 1, flower }],
      });
    }
    const updatedFlowers = get().flowers.map((f) => {
      if (f.id === flower.id) {
        const item = get().bouquetItems.find((i) => i.flowerId === flower.id);
        return { ...f, _selectedCount: item?.quantity || 0 };
      }
      return f;
    });
    set({ flowers: updatedFlowers });
  },

  removeBouquetItem: (flowerId) => {
    set({ bouquetItems: get().bouquetItems.filter((item) => item.flowerId !== flowerId) });
  },

  updateBouquetQuantity: (flowerId, quantity) => {
    if (quantity <= 0) {
      get().removeBouquetItem(flowerId);
      return;
    }
    const { bouquetItems, flowers } = get();
    const flower = flowers.find((f) => f.id === flowerId);
    if (flower && quantity > flower.stock) return;
    set({
      bouquetItems: bouquetItems.map((item) =>
        item.flowerId === flowerId ? { ...item, quantity } : item
      ),
    });
  },

  clearBouquet: () => set({ bouquetItems: [] }),
  setCurrentOrder: (order) => set({ currentOrder: order }),

  getTotalPrice: () => {
    return get().bouquetItems.reduce((sum, item) => sum + item.flower.price * item.quantity, 0);
  },

  getBouquetItem: (flowerId) => {
    return get().bouquetItems.find((item) => item.flowerId === flowerId);
  },
}));
