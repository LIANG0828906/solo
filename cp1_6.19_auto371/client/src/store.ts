import { create } from 'zustand';
import { Bouquet, CartItem, Order, RouteStop } from './types';

interface StoreState {
  cart: CartItem[];
  orders: Order[];
  routeStops: RouteStop[];
  cartOpen: boolean;
  currentPage: string;
  addToCart: (bouquet: Bouquet) => void;
  removeFromCart: (bouquetId: string) => void;
  updateQuantity: (bouquetId: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  setOrders: (orders: Order[]) => void;
  setRouteStops: (stops: RouteStop[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  cart: [],
  orders: [],
  routeStops: [],
  cartOpen: false,
  currentPage: 'catalog',

  addToCart: (bouquet) =>
    set((state) => {
      const existing = state.cart.find((item) => item.bouquet.id === bouquet.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.bouquet.id === bouquet.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { bouquet, quantity: 1 }] };
    }),

  removeFromCart: (bouquetId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.bouquet.id !== bouquetId),
    })),

  updateQuantity: (bouquetId, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((item) => item.bouquet.id !== bouquetId)
          : state.cart.map((item) =>
              item.bouquet.id === bouquetId ? { ...item, quantity } : item
            ),
    })),

  clearCart: () => set({ cart: [] }),

  setCartOpen: (open) => set({ cartOpen: open }),

  setCurrentPage: (page) => set({ currentPage: page }),

  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),

  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),

  setOrders: (orders) => set({ orders }),

  setRouteStops: (stops) => set({ routeStops: stops }),
}));
