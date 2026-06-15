import { create } from 'zustand';
import { api, Product, Order, OrderStatus, DashboardData, OrderItem } from './api';

interface AppStore {
  products: Product[];
  orders: Order[];
  dashboard: DashboardData | null;
  cart: OrderItem[];
  loading: boolean;

  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchAll: () => Promise<void>;

  addProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  createOrder: (customerName: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  products: [],
  orders: [],
  dashboard: null,
  cart: [],
  loading: false,

  fetchProducts: async () => {
    const products = await api.getProducts();
    set({ products });
  },

  fetchOrders: async () => {
    const orders = await api.getOrders();
    set({ orders });
  },

  fetchDashboard: async () => {
    const dashboard = await api.getDashboard();
    set({ dashboard });
  },

  fetchAll: async () => {
    set({ loading: true });
    try {
      await Promise.all([get().fetchProducts(), get().fetchOrders(), get().fetchDashboard()]);
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (data) => {
    await api.createProduct(data);
    await get().fetchProducts();
    await get().fetchDashboard();
  },

  updateProduct: async (id, data) => {
    await api.updateProduct(id, data);
    await get().fetchProducts();
    await get().fetchDashboard();
  },

  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        set({
          cart: cart.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        });
      }
    } else {
      set({
        cart: [
          ...cart,
          {
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            quantity: 1,
            price: product.price,
          },
        ],
      });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((i) => i.productId !== productId) });
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => {
    set({ cart: [] });
  },

  createOrder: async (customerName) => {
    const { cart } = get();
    if (cart.length === 0) return;
    await api.createOrder({ customerName, items: cart });
    set({ cart: [] });
    await get().fetchOrders();
    await get().fetchDashboard();
  },

  updateOrderStatus: async (id, status) => {
    await api.updateOrderStatus(id, status);
    await get().fetchOrders();
    await get().fetchProducts();
    await get().fetchDashboard();
  },
}));
