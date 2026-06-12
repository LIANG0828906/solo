import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
}

export interface Booth {
  id: string;
  user_id: string;
  name: string;
  description: string;
  bg_color: string;
  primary_color: string;
  accent_color: string;
  cover_image: string | null;
  visit_count: number;
  created_at: number;
  total_favorites?: number;
}

export interface Product {
  id: string;
  booth_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  favorite_count: number;
  created_at: number;
}

export interface ChatMessage {
  id: string;
  booth_id: string;
  sender_name: string;
  is_seller: number;
  content: string;
  created_at: number;
}

interface AppState {
  user: User | null;
  currentBooth: Booth | null;
  products: Product[];
  messages: ChatMessage[];
  hasNewMessage: boolean;
  notificationSound: boolean;
  visitorId: string;

  setUser: (user: User | null) => void;
  setCurrentBooth: (booth: Booth | null) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setHasNewMessage: (has: boolean) => void;
  setNotificationSound: (enabled: boolean) => void;
  setVisitorId: (id: string) => void;
}

const getVisitorId = (): string => {
  let id = localStorage.getItem('visitorId');
  if (!id) {
    id = 'visitor_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('visitorId', id);
  }
  return id;
};

export const useStore = create<AppState>((set) => ({
  user: null,
  currentBooth: null,
  products: [],
  messages: [],
  hasNewMessage: false,
  notificationSound: true,
  visitorId: getVisitorId(),

  setUser: (user) => set({ user }),
  setCurrentBooth: (booth) => set({ currentBooth: booth }),
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
  updateProduct: (product) => set((state) => ({
    products: state.products.map((p) => (p.id === product.id ? product : p)),
  })),
  removeProduct: (productId) => set((state) => ({
    products: state.products.filter((p) => p.id !== productId),
  })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  setHasNewMessage: (has) => set({ hasNewMessage: has }),
  setNotificationSound: (enabled) => set({ notificationSound: enabled }),
  setVisitorId: (id) => set({ visitorId: id }),
}));
