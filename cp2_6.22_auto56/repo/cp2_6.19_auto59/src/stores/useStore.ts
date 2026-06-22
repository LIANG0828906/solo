import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Product, Order, DeliveryRoute, Statistics, AppState } from '@/types';
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

function generateDeliveryPath(): { x: number; y: number }[] {
  const startX = 50 + Math.random() * 10 - 5;
  const startY = 50 + Math.random() * 10 - 5;
  const points: { x: number; y: number }[] = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + (Math.random() - 0.5) * 30 * t;
    const y = startY + (Math.random() - 0.5) * 30 * t;
    points.push({ x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
  }
  return points;
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

  createQuickOrder: (productId: string, quantity: number): boolean => {
    const product = get().products.find((p) => p.id === productId);
    if (!product) return false;

    const remainingStock = product.stock - product.sold;
    const remainingDaily = product.dailyLimit - product.sold;
    const maxAvailable = Math.min(remainingStock, remainingDaily);

    if (quantity <= 0 || quantity > maxAvailable) {
      return false;
    }

    const now = new Date().toISOString();
    const totalAmount = Math.round(product.price * quantity * 100) / 100;

    const newOrder: Order = {
      id: uuidv4(),
      userName: '模拟用户',
      userAvatar: '#2A9D8F',
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity,
          price: product.price,
        },
      ],
      totalAmount,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      deliveryLocation: { x: 50, y: 50 },
    };

    const orders = [newOrder, ...get().orders];
    set({ orders });
    storage.set(STORAGE_KEYS.ORDERS, orders);

    const products = get().products.map((p) =>
      p.id === productId ? { ...p, sold: p.sold + quantity } : p
    );
    set({ products });
    storage.set(STORAGE_KEYS.PRODUCTS, products);

    const newRoute = {
      orderId: newOrder.id,
      path: generateDeliveryPath(),
      currentIndex: 0,
      progress: 0,
    };
    const deliveryRoutes = [...get().deliveryRoutes, newRoute];
    set({ deliveryRoutes });
    storage.set(STORAGE_KEYS.DELIVERY_ROUTES, deliveryRoutes);

    get().calculateStatistics();
    return true;
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
