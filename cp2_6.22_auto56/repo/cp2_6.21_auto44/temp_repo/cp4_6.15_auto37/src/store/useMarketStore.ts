import { create } from 'zustand';
import type { Stall, Product, Transaction, Favorite, ProductCategory } from '@/types';
import { storage, generateId } from '@/utils/storage';

interface MarketState {
  stalls: Stall[];
  products: Product[];
  transactions: Transaction[];
  favorites: Favorite[];

  init: () => void;

  addStall: (data: Omit<Stall, 'id' | 'createdAt'>) => Stall;
  updateStall: (id: string, patch: Partial<Stall>) => void;
  deleteStall: (id: string) => void;

  addProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  createTransaction: (
    productId: string,
    buyerNickname: string,
    quantity: number
  ) => Transaction | null;
  cancelTransaction: (id: string) => boolean;

  toggleFavorite: (productId: string) => boolean;
  isFavorite: (productId: string) => boolean;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  stalls: [],
  products: [],
  transactions: [],
  favorites: [],

  init: () => {
    set({
      stalls: storage.getStalls(),
      products: storage.getProducts(),
      transactions: storage.getTransactions(),
      favorites: storage.getFavorites(),
    });
  },

  addStall: (data) => {
    const stall: Stall = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    const stalls = storage.addStall(stall);
    set({ stalls });
    return stall;
  },

  updateStall: (id, patch) => {
    const stalls = storage.updateStall(id, patch);
    set({ stalls });
  },

  deleteStall: (id) => {
    const stalls = storage.deleteStall(id);
    const products = storage.getProducts().filter(p => p.stallId !== id);
    storage.setProducts(products);
    set({ stalls, products });
  },

  addProduct: (data) => {
    const product: Product = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    const products = storage.addProduct(product);
    set({ products });
    return product;
  },

  updateProduct: (id, patch) => {
    const products = storage.updateProduct(id, patch);
    set({ products });
  },

  deleteProduct: (id) => {
    const products = storage.deleteProduct(id);
    set({ products });
  },

  createTransaction: (productId, buyerNickname, quantity) => {
    const { products, stalls } = get();
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity < quantity || quantity <= 0) return null;

    const stall = stalls.find(s => s.id === product.stallId);

    const tx: Transaction = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      stallId: product.stallId,
      stallName: stall?.name ?? '未知摊位',
      buyerNickname,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      status: 'completed',
      createdAt: Date.now(),
    };

    const transactions = storage.addTransaction(tx);
    const updatedProducts = storage.updateProduct(product.id, {
      quantity: product.quantity - quantity,
    });

    set({ transactions, products: updatedProducts });
    return tx;
  },

  cancelTransaction: (id) => {
    const { transactions, products } = get();
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.status === 'cancelled') return false;

    const FIVE_MINUTES = 5 * 60 * 1000;
    if (Date.now() - tx.createdAt > FIVE_MINUTES) return false;

    const updatedTxs = storage.updateTransaction(id, {
      status: 'cancelled',
      cancelledAt: Date.now(),
    });

    const product = products.find(p => p.id === tx.productId);
    let updatedProducts = products;
    if (product) {
      updatedProducts = storage.updateProduct(product.id, {
        quantity: product.quantity + tx.quantity,
      });
    }

    set({ transactions: updatedTxs, products: updatedProducts });
    return true;
  },

  toggleFavorite: (productId) => {
    const { favorites } = get();
    const exists = favorites.some(f => f.productId === productId);
    if (exists) {
      const updated = storage.removeFavorite(productId);
      set({ favorites: updated });
      return false;
    } else {
      const updated = storage.addFavorite({
        id: generateId(),
        productId,
        createdAt: Date.now(),
      });
      set({ favorites: updated });
      return true;
    }
  },

  isFavorite: (productId) => {
    return get().favorites.some(f => f.productId === productId);
  },
}));

export function getStallById(stalls: Stall[], id: string): Stall | undefined {
  return stalls.find(s => s.id === id);
}

export function getProductsByStall(products: Product[], stallId: string): Product[] {
  return products.filter(p => p.stallId === stallId);
}

export function filterProducts(
  products: Product[],
  stalls: Stall[],
  options: {
    search?: string;
    category?: ProductCategory | 'all';
    area?: string;
    minPrice?: number;
    maxPrice?: number;
  }
): Product[] {
  const { search, category = 'all', area = '', minPrice = 0, maxPrice = Infinity } = options;
  const lower = search?.trim().toLowerCase() ?? '';

  return products.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (p.price < minPrice || p.price > maxPrice) return false;

    const stall = stalls.find(s => s.id === p.stallId);
    if (area && stall?.area !== area) return false;

    if (lower) {
      const matchName = p.name.toLowerCase().includes(lower);
      const matchStall = stall?.name.toLowerCase().includes(lower);
      const matchDesc = p.description.toLowerCase().includes(lower);
      if (!matchName && !matchStall && !matchDesc) return false;
    }
    return true;
  });
}
