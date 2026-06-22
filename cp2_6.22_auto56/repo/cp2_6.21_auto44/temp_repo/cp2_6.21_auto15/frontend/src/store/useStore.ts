import { create } from 'zustand';
import type { Store, Product, Order, DeliveryOrder } from '../types';

const useStore = create<Store>((set) => ({
  cart: [],
  orders: [],
  products: [],
  deliveryOrders: [],
  selectedCategory: '',
  isCartOpen: false,
  toast: {
    show: false,
    message: '',
    type: 'success',
  },
  isLoggedIn: false,

  addToCart: (product: Product, quantity: number) =>
    set((state) => {
      const existingItem = state.cart.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return {
        cart: [...state.cart, { product, quantity }],
      };
    }),

  removeFromCart: (productId: number) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),

  updateQuantity: (productId: number, quantity: number) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    })),

  clearCart: () =>
    set(() => ({
      cart: [],
    })),

  showToast: (message: string, type: 'success' | 'error' | 'warning') => {
    set(() => ({
      toast: {
        show: true,
        message,
        type,
      },
    }));
    setTimeout(() => {
      set(() => ({
        toast: {
          show: false,
          message: '',
          type: 'success',
        },
      }));
    }, 3000);
  },

  toggleCart: () =>
    set((state) => ({
      isCartOpen: !state.isCartOpen,
    })),

  setCategory: (category: string) =>
    set(() => ({
      selectedCategory: category,
    })),

  setLoggedIn: (value: boolean) =>
    set(() => ({
      isLoggedIn: value,
    })),

  loadProducts: (products: Product[]) =>
    set(() => ({
      products,
    })),

  loadOrders: (orders: Order[]) =>
    set(() => ({
      orders,
    })),

  loadDeliveryOrders: (deliveryOrders: DeliveryOrder[]) =>
    set(() => ({
      deliveryOrders,
    })),
}));

export default useStore;
