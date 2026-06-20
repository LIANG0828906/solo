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
  refreshBouquetStock: () => void;
}

export const useFlowerStore = create<FlowerStore>((set, get) => ({
  flowers: [],
  bouquetItems: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  setFlowers: (flowers) => {
    set({ flowers });
    get().refreshBouquetStock();
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addBouquetItem: (flower) => {
    const { bouquetItems } = get();
    const existing = bouquetItems.find((item) => item.flowerId === flower.id);
    if (existing) {
      const newQuantity = existing.quantity + 1;
      if (newQuantity > flower.stock) return;
      set({
        bouquetItems: bouquetItems.map((item) =>
          item.flowerId === flower.id ? { ...item, quantity: newQuantity, flower: { ...flower } } : item
        ),
      });
    } else {
      if (flower.stock <= 0) return;
      set({
        bouquetItems: [...bouquetItems, { flowerId: flower.id, quantity: 1, flower: { ...flower } }],
      });
    }
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
        item.flowerId === flowerId ? { ...item, quantity, flower: flower ? { ...flower } : item.flower } : item
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

  refreshBouquetStock: () => {
    const { flowers, bouquetItems } = get();
    if (bouquetItems.length === 0) return;

    const updatedItems = bouquetItems
      .map((item) => {
        const latestFlower = flowers.find((f) => f.id === item.flowerId);
        if (!latestFlower) return null;
        if (latestFlower.stock <= 0) return null;
        const newQuantity = Math.min(item.quantity, latestFlower.stock);
        return {
          ...item,
          quantity: newQuantity,
          flower: { ...latestFlower },
        };
      })
      .filter((item): item is BouquetItem => item !== null && item.quantity > 0);

    set({ bouquetItems: updatedItems });
  },
}));
