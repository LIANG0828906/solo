import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Product, Order, OrderStatus, DeliveryRoute, Statistics, AppState } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateAllMockData } from '@/utils/mockData';

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isYesterday(dateString: string): boolean {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

const initialState = {
  products: [],
  orders: [],
  deliveryRoutes: [],
  statistics: {
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    yesterdayOrders: 0,
    yesterdayRevenue: 0,
  },
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  addProduct: (productData) => {
    const newProduct: Product = {
      id: uuidv4(),
      ...productData,
      sold: 0,
      createdAt: new Date().toISOString(),
    };
    const products = [...get().products, newProduct];
    set({ products });
    storage.set(STORAGE_KEYS.PRODUCTS, products);
  },

  updateProduct: (id, productData) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, ...productData } : p
    );
    set({ products });
    storage.set(STORAGE_KEYS.PRODUCTS, products);
  },

  deleteProduct: (id) => {
    const products = get().products.filter((p) => p.id !== id);
    set({ products });
    storage.set(STORAGE_KEYS.PRODUCTS, products);
  },

  updateOrderStatus: (id, status) => {
    const now = new Date().toISOString();
    const orders = get().orders.map((order) =>
      order.id === id
        ? { ...order, status, updatedAt: now }
        : order
    );
    set({ orders });
    storage.set(STORAGE_KEYS.ORDERS, orders);
    get().calculateStatistics();
  },

  updateDeliveryLocation: (orderId, location) => {
    const orders = get().orders.map((order) =>
      order.id === orderId
        ? { ...order, deliveryLocation: location }
        : order
    );
    set({ orders });
    storage.set(STORAGE_KEYS.ORDERS, orders);
  },

  calculateStatistics: () => {
    const { orders } = get();
    const statistics: Statistics = {
      todayOrders: 0,
      todayRevenue: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      yesterdayOrders: 0,
      yesterdayRevenue: 0,
    };

    orders.forEach((order) => {
      if (isToday(order.createdAt)) {
        statistics.todayOrders++;
        statistics.todayRevenue += order.totalAmount;
        if (order.status === 'pending') statistics.pendingOrders++;
        if (order.status === 'delivered') statistics.deliveredOrders++;
      }
      if (isYesterday(order.createdAt)) {
        statistics.yesterdayOrders++;
        statistics.yesterdayRevenue += order.totalAmount;
      }
    });

    statistics.todayRevenue = Math.round(statistics.todayRevenue * 100) / 100;
    statistics.yesterdayRevenue = Math.round(statistics.yesterdayRevenue * 100) / 100;

    set({ statistics });
  },

  initializeMockData: () => {
    const initialized = storage.get(STORAGE_KEYS.INITIALIZED, false);
    
    if (initialized) {
      const products = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const orders = storage.get<Order[]>(STORAGE_KEYS.ORDERS, []);
      const deliveryRoutes = storage.get<DeliveryRoute[]>(STORAGE_KEYS.DELIVERY_ROUTES, []);
      set({ products, orders, deliveryRoutes });
    } else {
      const { products, orders, deliveryRoutes } = generateAllMockData();
      storage.set(STORAGE_KEYS.PRODUCTS, products);
      storage.set(STORAGE_KEYS.ORDERS, orders);
      storage.set(STORAGE_KEYS.DELIVERY_ROUTES, deliveryRoutes);
      storage.set(STORAGE_KEYS.INITIALIZED, true);
      set({ products, orders, deliveryRoutes });
    }

    get().calculateStatistics();
  },
}));
