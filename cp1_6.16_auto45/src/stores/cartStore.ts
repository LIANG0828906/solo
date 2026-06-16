import { create } from "zustand";

export interface CartItem {
  eventId: string;
  eventName: string;
  tier: string;
  price: number;
  quantity: number;
  posterUrl: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (eventId: string, tier: string) => void;
  updateQuantity: (eventId: string, tier: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(
        (i) => i.eventId === item.eventId && i.tier === item.tier
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.eventId === item.eventId && i.tier === item.tier
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (eventId, tier) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.eventId === eventId && i.tier === tier)
      ),
    }));
  },

  updateQuantity: (eventId, tier, quantity) => {
    if (quantity <= 0) {
      get().removeItem(eventId, tier);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.eventId === eventId && i.tier === tier ? { ...i, quantity } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
}));
