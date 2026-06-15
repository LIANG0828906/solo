import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import booksData from '@/data/books.json';
import type { Book, CartItem, Category, SortBy, Discount } from '@/types';
import { VALID_DISCOUNT_CODES } from '@/types';

interface BooksStore {
  books: Book[];
  cart: CartItem[];
  filter: Category;
  sortBy: SortBy;
  discount: Discount;

  setFilter: (f: Category) => void;
  setSortBy: (s: SortBy) => void;
  getBookById: (id: string) => Book | undefined;
  getFilteredBooks: () => Book[];
  getRecommendedBooks: (bookId: string) => Book[];
  addToCart: (bookId: string, qty: number) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  applyDiscount: (code: string) => { success: boolean; message: string };
  getCartTotalCount: () => number;
  getCartSubtotal: () => number;
  getCartDiscountAmount: () => number;
  getCartTotal: () => number;
  getBookFromCartItem: (item: CartItem) => Book | undefined;
}

export const useBooksStore = create<BooksStore>((set, get) => ({
  books: booksData as Book[],
  cart: [],
  filter: '全部',
  sortBy: 'default',
  discount: { code: '', rate: 1, applied: false },

  setFilter: (f) => set({ filter: f }),
  setSortBy: (s) => set({ sortBy: s }),

  getBookById: (id) => get().books.find((b) => b.id === id),

  getFilteredBooks: () => {
    const { books, filter, sortBy } = get();
    let result = filter === '全部' ? [...books] : books.filter((b) => b.category === filter);
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        break;
    }
    return result;
  },

  getRecommendedBooks: (bookId) => {
    const current = get().books.find((b) => b.id === bookId);
    if (!current) return [];
    return get()
      .books.filter((b) => b.category === current.category && b.id !== bookId)
      .slice(0, 4);
  },

  addToCart: (bookId, qty) => {
    const book = get().books.find((b) => b.id === bookId);
    if (!book) return;
    const existing = get().cart.find((item) => item.bookId === bookId);
    if (existing) {
      const newQty = Math.min(existing.quantity + qty, book.stock);
      set({
        cart: get().cart.map((item) =>
          item.id === existing.id ? { ...item, quantity: newQty } : item
        ),
      });
    } else {
      const newQty = Math.min(qty, book.stock);
      set({ cart: [...get().cart, { id: uuidv4(), bookId, quantity: newQty }] });
    }
  },

  updateCartItemQty: (itemId, qty) => {
    const item = get().cart.find((i) => i.id === itemId);
    if (!item) return;
    const book = get().books.find((b) => b.id === item.bookId);
    if (!book) return;
    const safeQty = Math.max(1, Math.min(qty, book.stock));
    set({
      cart: get().cart.map((i) => (i.id === itemId ? { ...i, quantity: safeQty } : i)),
    });
  },

  removeFromCart: (itemId) => {
    set({ cart: get().cart.filter((i) => i.id !== itemId) });
  },

  clearCart: () => {
    set({ cart: [], discount: { code: '', rate: 1, applied: false } });
  },

  applyDiscount: (code) => {
    const trimmed = code.trim().toUpperCase();
    if (VALID_DISCOUNT_CODES[trimmed]) {
      set({ discount: { code: trimmed, rate: VALID_DISCOUNT_CODES[trimmed], applied: true } });
      return { success: true, message: `已应用优惠码 ${trimmed}，享受${(10 - VALID_DISCOUNT_CODES[trimmed] * 10)}折优惠！` };
    }
    set({ discount: { code: '', rate: 1, applied: false } });
    return { success: false, message: '优惠码无效，请重新输入' };
  },

  getCartTotalCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
  getCartSubtotal: () => {
    const { cart, books } = get();
    return cart.reduce((sum, item) => {
      const book = books.find((b) => b.id === item.bookId);
      return sum + (book ? book.price * item.quantity : 0);
    }, 0);
  },
  getCartDiscountAmount: () => {
    const subtotal = get().getCartSubtotal();
    return subtotal * (1 - get().discount.rate);
  },
  getCartTotal: () => {
    return get().getCartSubtotal() - get().getCartDiscountAmount();
  },
  getBookFromCartItem: (item) => get().books.find((b) => b.id === item.bookId),
}));
