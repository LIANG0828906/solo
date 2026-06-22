import { create } from 'zustand';
import type { Book, CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (book: Book) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (book: Book) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.bookId === book.id
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.bookId === book.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { bookId: book.id, book, quantity: 1 }],
      };
    });
  },

  removeItem: (bookId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.bookId !== bookId),
    }));
  },

  updateQuantity: (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(bookId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.bookId === bookId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.book.price * item.quantity,
      0
    );
  },
}));
