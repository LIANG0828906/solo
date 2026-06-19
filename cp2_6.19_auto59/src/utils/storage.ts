const STORAGE_KEYS = {
  PRODUCTS: 'community_products',
  ORDERS: 'community_orders',
  DELIVERY_ROUTES: 'community_delivery_routes',
  INITIALIZED: 'community_initialized',
} as const;

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage save error:', error);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

export { STORAGE_KEYS };
