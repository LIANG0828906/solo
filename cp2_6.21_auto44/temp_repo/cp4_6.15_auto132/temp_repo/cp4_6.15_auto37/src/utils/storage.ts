import type { Stall, Product, Transaction, Favorite } from '@/types';

const KEYS = {
  STALLS: 'fm_stalls',
  PRODUCTS: 'fm_products',
  TRANSACTIONS: 'fm_transactions',
  FAVORITES: 'fm_favorites',
} as const;

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  getStalls: (): Stall[] => readArray<Stall>(KEYS.STALLS),
  setStalls: (stalls: Stall[]) => writeArray<Stall>(KEYS.STALLS, stalls),
  addStall: (stall: Stall): Stall[] => {
    const stalls = storage.getStalls();
    const updated = [...stalls, stall];
    storage.setStalls(updated);
    return updated;
  },
  updateStall: (id: string, patch: Partial<Stall>): Stall[] => {
    const stalls = storage.getStalls().map(s =>
      s.id === id ? { ...s, ...patch } : s
    );
    storage.setStalls(stalls);
    return stalls;
  },
  deleteStall: (id: string): Stall[] => {
    const stalls = storage.getStalls().filter(s => s.id !== id);
    storage.setStalls(stalls);
    return stalls;
  },

  getProducts: (): Product[] => readArray<Product>(KEYS.PRODUCTS),
  setProducts: (products: Product[]) => writeArray<Product>(KEYS.PRODUCTS, products),
  addProduct: (product: Product): Product[] => {
    const products = storage.getProducts();
    const updated = [...products, product];
    storage.setProducts(updated);
    return updated;
  },
  updateProduct: (id: string, patch: Partial<Product>): Product[] => {
    const products = storage.getProducts().map(p =>
      p.id === id ? { ...p, ...patch } : p
    );
    storage.setProducts(products);
    return products;
  },
  deleteProduct: (id: string): Product[] => {
    const products = storage.getProducts().filter(p => p.id !== id);
    storage.setProducts(products);
    return products;
  },

  getTransactions: (): Transaction[] => readArray<Transaction>(KEYS.TRANSACTIONS),
  setTransactions: (txs: Transaction[]) => writeArray<Transaction>(KEYS.TRANSACTIONS, txs),
  addTransaction: (tx: Transaction): Transaction[] => {
    const txs = storage.getTransactions();
    const updated = [...txs, tx];
    storage.setTransactions(updated);
    return updated;
  },
  updateTransaction: (id: string, patch: Partial<Transaction>): Transaction[] => {
    const txs = storage.getTransactions().map(t =>
      t.id === id ? { ...t, ...patch } : t
    );
    storage.setTransactions(txs);
    return txs;
  },

  getFavorites: (): Favorite[] => readArray<Favorite>(KEYS.FAVORITES),
  setFavorites: (favs: Favorite[]) => writeArray<Favorite>(KEYS.FAVORITES, favs),
  addFavorite: (fav: Favorite): Favorite[] => {
    const favs = storage.getFavorites();
    const updated = [...favs, fav];
    storage.setFavorites(updated);
    return updated;
  },
  removeFavorite: (productId: string): Favorite[] => {
    const favs = storage.getFavorites().filter(f => f.productId !== productId);
    storage.setFavorites(favs);
    return favs;
  },
  isFavorite: (productId: string): boolean => {
    return storage.getFavorites().some(f => f.productId === productId);
  },
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
