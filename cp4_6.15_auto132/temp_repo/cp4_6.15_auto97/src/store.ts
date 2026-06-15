import { create } from 'zustand';
import type { Book, User, CartItem, Order, Borrow, FilterOptions, ApiResponse } from './types';
import * as api from './api';

interface CircleRevealState {
  active: boolean;
  x: number;
  y: number;
  color: string;
}

interface AppState {
  books: Book[];
  booksLoading: boolean;
  cart: CartItem[];
  cartOpen: boolean;
  user: User | null;
  orders: Order[];
  borrows: Borrow[];
  searchQuery: string;
  filters: FilterOptions;
  searchSuggestions: Book[];
  circleReveal: CircleRevealState;

  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  fetchBooks: () => Promise<void>;
  searchBooks: (query: string) => Promise<void>;
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  updateCartQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: (open?: boolean) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  fetchOrders: (userId: string) => Promise<void>;
  submitOrder: (
    address: { name: string; phone: string; address: string },
    paymentMethod: string,
    userId: string
  ) => Promise<ApiResponse<Order>>;
  fetchBorrows: (userId: string) => Promise<void>;
  fetchAllBorrows: () => Promise<void>;
  renewBorrow: (id: string) => Promise<void>;
  returnBorrow: (id: string) => Promise<void>;
  setCircleReveal: (state: Partial<CircleRevealState>) => void;
}

const initialFilters: FilterOptions = {
  category: 'all',
  priceRange: [0, 500],
  stockStatus: 'all',
};

export const useStore = create<AppState>((set, get) => ({
  books: [],
  booksLoading: false,
  cart: [],
  cartOpen: false,
  user: null,
  orders: [],
  borrows: [],
  searchQuery: '',
  filters: initialFilters,
  searchSuggestions: [],
  circleReveal: { active: false, x: 0, y: 0, color: '#C67B3D' },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setCircleReveal: (state) =>
    set((prev) => ({ circleReveal: { ...prev.circleReveal, ...state } })),

  fetchBooks: async () => {
    set({ booksLoading: true });
    const response = await api.fetchBooks();
    if (response.success && response.data) {
      set({ books: response.data, booksLoading: false });
    } else {
      set({ booksLoading: false });
    }
  },

  searchBooks: async (query) => {
    if (!query.trim()) {
      set({ searchSuggestions: [] });
      return;
    }
    const response = await api.searchBooks(query);
    if (response.success && response.data) {
      set({ searchSuggestions: response.data.slice(0, 5) });
    }
  },

  addToCart: (book) => {
    set((state) => {
      const existing = state.cart.find((item) => item.bookId === book.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.bookId === book.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        cart: [...state.cart, { bookId: book.id, book, quantity: 1 }],
      };
    });
  },

  removeFromCart: (bookId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.bookId !== bookId),
    }));
  },

  updateCartQuantity: (bookId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(bookId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.bookId === bookId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => set({ cart: [] }),

  toggleCart: (open) => {
    set((state) => ({
      cartOpen: typeof open === 'boolean' ? open : !state.cartOpen,
    }));
  },

  setUser: (user) => set({ user }),

  logout: () => {
    set({ user: null, orders: [], borrows: [], cart: [] });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  fetchOrders: async (userId) => {
    const response = await api.fetchOrders(userId);
    if (response.success && response.data) {
      set({ orders: response.data });
    }
  },

  submitOrder: async (address, paymentMethod, userId) => {
    const { cart } = get();
    const response = await api.submitOrder(cart, address, paymentMethod, userId);
    if (response.success && response.data) {
      set((state) => ({
        orders: [...state.orders, response.data!],
        cart: [],
        cartOpen: false,
      }));
    }
    return response;
  },

  fetchBorrows: async (userId) => {
    const response = await api.fetchBorrows(userId);
    if (response.success && response.data) {
      set({ borrows: response.data });
    }
  },

  fetchAllBorrows: async () => {
    const response = await api.fetchAllBorrows();
    if (response.success && response.data) {
      set({ borrows: response.data });
    }
  },

  renewBorrow: async (id) => {
    const response = await api.renewBorrow(id);
    if (response.success && response.data) {
      set((state) => ({
        borrows: state.borrows.map((b) =>
          b.id === id ? response.data! : b
        ),
      }));
    }
  },

  returnBorrow: async (id) => {
    const response = await api.returnBorrow(id);
    if (response.success && response.data) {
      set((state) => ({
        borrows: state.borrows.map((b) =>
          b.id === id ? response.data! : b
        ),
      }));
    }
  },
}));
