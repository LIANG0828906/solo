import { create } from 'zustand';
import type { CartItem, Book } from '../types';

interface StoreState {
  cartItems: CartItem[];
  cartBounceKey: number;
  viewedCategories: string[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  triggerCartBounce: () => void;
  recordView: (category: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useStore = create<StoreState>((set, get) => ({
  cartItems: [],
  cartBounceKey: 0,
  viewedCategories: [],

  addToCart: (book) => {
    set((state) => {
      const existing = state.cartItems.find((i) => i.bookId === book.id);
      if (existing) {
        return {
          cartItems: state.cartItems.map((i) =>
            i.bookId === book.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        };
      }
      return {
        cartItems: [
          ...state.cartItems,
          {
            bookId: book.id,
            title: book.title,
            price: book.price,
            quantity: 1,
            cover: book.cover
          }
        ]
      };
    });
    get().triggerCartBounce();
  },

  removeFromCart: (bookId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.bookId !== bookId)
    }));
  },

  updateQuantity: (bookId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(bookId);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.bookId === bookId ? { ...i, quantity } : i
      )
    }));
  },

  clearCart: () => set({ cartItems: [] }),

  triggerCartBounce: () => {
    set((state) => ({ cartBounceKey: state.cartBounceKey + 1 }));
  },

  recordView: (category) => {
    set((state) => {
      if (state.viewedCategories.includes(category)) return state;
      return { viewedCategories: [...state.viewedCategories, category] };
    });
  },

  getCartTotal: () => {
    return get().cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getCartCount: () => {
    return get().cartItems.reduce((sum, i) => sum + i.quantity, 0);
  }
}));
