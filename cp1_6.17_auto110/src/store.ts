import { create } from 'zustand';

export interface Track {
  number: number;
  title: string;
}

export interface Record {
  id: string;
  coverUrl: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  price: number;
  stock: number;
  tracks: Track[];
}

export interface CartItem {
  record: Record;
  quantity: number;
}

export interface CurrentTrack {
  recordId: string;
  recordTitle: string;
  coverUrl: string;
  trackNumber: number;
  trackTitle: string;
}

interface StoreState {
  records: Record[];
  cart: CartItem[];
  currentTrack: CurrentTrack | null;
  loading: boolean;
  error: string | null;
  fetchRecords: () => Promise<void>;
  addToCart: (record: Record) => void;
  removeFromCart: (recordId: string) => void;
  updateQuantity: (recordId: string, quantity: number) => void;
  clearCart: () => void;
  setCurrentTrack: (track: CurrentTrack | null) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  records: [],
  cart: [],
  currentTrack: null,
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/records');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Record[] = await res.json();
      set({ records: data, loading: false });
    } catch {
      set({ error: '获取唱片列表失败', loading: false });
    }
  },

  addToCart: (record: Record) => {
    set((state) => {
      const existing = state.cart.find((item) => item.record.id === record.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.record.id === record.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return { cart: [...state.cart, { record, quantity: 1 }] };
    });
  },

  removeFromCart: (recordId: string) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.record.id !== recordId)
    }));
  },

  updateQuantity: (recordId: string, quantity: number) => {
    if (quantity <= 0) {
      set((state) => ({
        cart: state.cart.filter((item) => item.record.id !== recordId)
      }));
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.record.id === recordId ? { ...item, quantity } : item
      )
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  setCurrentTrack: (track: CurrentTrack | null) => {
    set({ currentTrack: track });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));
