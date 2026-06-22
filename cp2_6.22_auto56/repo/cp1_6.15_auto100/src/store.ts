import { create } from 'zustand';
import type { Member } from './api';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

interface AppState {
  member: Member | null;
  setMember: (member: Member) => void;
  clearMember: () => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  pointsToast: { points: number; show: boolean };
  showPointsToast: (points: number) => void;
  isAdmin: boolean;
  setAdmin: () => void;
  clearAdmin: () => void;
  cartTotal: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  member: null,
  setMember: (member) => set({ member }),
  clearMember: () => set({ member: null }),
  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((c) => c.menuItemId === item.menuItemId);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.menuItemId === item.menuItemId ? { ...c, quantity: c.quantity + 1 } : c
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantity: 1 }] };
    }),
  removeFromCart: (menuItemId) =>
    set((state) => ({ cart: state.cart.filter((c) => c.menuItemId !== menuItemId) })),
  updateQuantity: (menuItemId, quantity) =>
    set((state) => ({
      cart: quantity <= 0
        ? state.cart.filter((c) => c.menuItemId !== menuItemId)
        : state.cart.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity } : c)),
    })),
  clearCart: () => set({ cart: [] }),
  cartOpen: false,
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
  setCartOpen: (open) => set({ cartOpen: open }),
  pointsToast: { points: 0, show: false },
  showPointsToast: (points) => set({ pointsToast: { points, show: true } }),
  isAdmin: false,
  setAdmin: () => set({ isAdmin: true }),
  clearAdmin: () => set({ isAdmin: false }),
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
