import { create } from 'zustand';
import { Photo, CartItem, Order, PrintSize } from '../types';
import { SIZE_PRICES } from '../types';

interface AppState {
  photos: Photo[];
  orders: Order[];
  favoriteIds: Set<string>;
  cart: CartItem[];
  editingPhoto: Photo | null;
  isEditorOpen: boolean;
  isOrderOpen: boolean;
  loading: boolean;

  setPhotos: (photos: Photo[]) => void;
  addPhotos: (photos: Photo[]) => void;
  updatePhoto: (photo: Photo) => void;

  toggleFavorite: (photoId: string) => void;
  isFavorite: (photoId: string) => boolean;
  getFavoritePhotos: () => Photo[];

  addToCart: (photo: Photo, size: PrintSize, quantity: number) => void;
  updateCartItem: (photoId: string, size: PrintSize, quantity: number) => void;
  removeFromCart: (photoId: string, size: PrintSize) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  openEditor: (photo: Photo) => void;
  closeEditor: () => void;

  openOrder: () => void;
  closeOrder: () => void;

  setLoading: (loading: boolean) => void;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  photos: [],
  orders: [],
  favoriteIds: new Set(loadFromStorage<string[]>('favoriteIds', [])),
  cart: loadFromStorage<CartItem[]>('cart', []),
  editingPhoto: null,
  isEditorOpen: false,
  isOrderOpen: false,
  loading: false,

  setPhotos: (photos) => set({ photos }),
  addPhotos: (newPhotos) => set((state) => ({
    photos: [...newPhotos, ...state.photos].sort((a, b) => b.uploadTime - a.uploadTime)
  })),
  updatePhoto: (photo) => set((state) => ({
    photos: state.photos.map(p => p.id === photo.id ? photo : p),
    cart: state.cart.map(item =>
      item.photo.id === photo.id ? { ...item, photo } : item
    )
  })),

  toggleFavorite: (photoId) => set((state) => {
    const newFavorites = new Set(state.favoriteIds);
    if (newFavorites.has(photoId)) {
      newFavorites.delete(photoId);
    } else {
      newFavorites.add(photoId);
    }
    saveToStorage('favoriteIds', Array.from(newFavorites));
    return { favoriteIds: newFavorites };
  }),
  isFavorite: (photoId) => get().favoriteIds.has(photoId),
  getFavoritePhotos: () => {
    const { photos, favoriteIds } = get();
    return photos.filter(p => favoriteIds.has(p.id));
  },

  addToCart: (photo, size, quantity) => set((state) => {
    const existingIndex = state.cart.findIndex(
      item => item.photo.id === photo.id && item.size === size
    );
    let newCart: CartItem[];
    if (existingIndex >= 0) {
      newCart = [...state.cart];
      newCart[existingIndex] = { ...newCart[existingIndex], quantity };
    } else {
      newCart = [...state.cart, { photo, size, quantity }];
    }
    saveToStorage('cart', newCart);
    return { cart: newCart };
  }),
  updateCartItem: (photoId, size, quantity) => set((state) => {
    const newCart = state.cart.map(item =>
      item.photo.id === photoId && item.size === size
        ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) }
        : item
    );
    saveToStorage('cart', newCart);
    return { cart: newCart };
  }),
  removeFromCart: (photoId, size) => set((state) => {
    const newCart = state.cart.filter(
      item => !(item.photo.id === photoId && item.size === size)
    );
    saveToStorage('cart', newCart);
    return { cart: newCart };
  }),
  clearCart: () => {
    saveToStorage('cart', []);
    set({ cart: [] });
  },
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => {
      return sum + SIZE_PRICES[item.size] * item.quantity;
    }, 0);
  },

  setOrders: (orders) => set({ orders }),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o =>
      o.id === orderId ? { ...o, status } : o
    )
  })),

  openEditor: (photo) => set({ editingPhoto: photo, isEditorOpen: true }),
  closeEditor: () => set({ editingPhoto: null, isEditorOpen: false }),

  openOrder: () => set({ isOrderOpen: true }),
  closeOrder: () => set({ isOrderOpen: false }),

  setLoading: (loading) => set({ loading })
}));
