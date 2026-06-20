import { create } from 'zustand';
import type { Product, Order, PanelId, QuoteItem } from '../types';

interface AppState {
  products: Product[];
  orders: Order[];
  activePanel: PanelId;
  selectedProductIds: Set<string>;
  quoteItems: QuoteItem[];
  quotePanelOpen: boolean;
  editingProduct: Product | null;
  showAddModal: boolean;
  loading: boolean;

  setActivePanel: (panel: PanelId) => void;
  setProducts: (products: Product[]) => void;
  setOrders: (orders: Order[]) => void;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  removeProduct: (id: string) => void;
  toggleProductSelection: (id: string) => void;
  clearSelection: () => void;
  setQuotePanelOpen: (open: boolean, items?: QuoteItem[]) => void;
  updateQuoteItemQuantity: (productId: string, qty: number) => void;
  removeQuoteItem: (productId: string) => void;
  setEditingProduct: (p: Product | null) => void;
  setShowAddModal: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  addOrder: (order: Order) => void;
  decrementStock: (items: { productId: string; quantity: number }[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  orders: [],
  activePanel: 'products',
  selectedProductIds: new Set(),
  quoteItems: [],
  quotePanelOpen: false,
  editingProduct: null,
  showAddModal: false,
  loading: true,

  setActivePanel: (panel) => set({ activePanel: panel }),
  setProducts: (products) => set({ products }),
  setOrders: (orders) => set({ orders }),

  addProduct: (p) =>
    set((s) => ({ products: [p, ...s.products] })),

  updateProduct: (p) =>
    set((s) => ({
      products: s.products.map((x) => (x.id === p.id ? p : x))
    })),

  removeProduct: (id) =>
    set((s) => ({
      products: s.products.filter((x) => x.id !== id),
      selectedProductIds: new Set([...s.selectedProductIds].filter((x) => x !== id))
    })),

  toggleProductSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedProductIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedProductIds: next };
    }),

  clearSelection: () => set({ selectedProductIds: new Set() }),

  setQuotePanelOpen: (open, items) =>
    set(() => ({
      quotePanelOpen: open,
      quoteItems: items ?? get().quoteItems
    })),

  updateQuoteItemQuantity: (productId, qty) =>
    set((s) => ({
      quoteItems: s.quoteItems.map((it) =>
        it.productId === productId ? { ...it, quantity: Math.max(1, qty) } : it
      )
    })),

  removeQuoteItem: (productId) =>
    set((s) => ({
      quoteItems: s.quoteItems.filter((it) => it.productId !== productId)
    })),

  setEditingProduct: (p) => set({ editingProduct: p }),
  setShowAddModal: (show) => set({ showAddModal: show }),
  setLoading: (loading) => set({ loading }),

  addOrder: (order) =>
    set((s) => ({ orders: [order, ...s.orders] })),

  decrementStock: (items) =>
    set((s) => {
      const map = new Map(items.map((i) => [i.productId, i.quantity]));
      return {
        products: s.products.map((p) =>
          map.has(p.id) ? { ...p, stock: Math.max(0, p.stock - (map.get(p.id) || 0)) } : p
        )
      };
    })
}));
