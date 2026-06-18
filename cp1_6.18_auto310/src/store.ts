import { create } from 'zustand';
import { Order, OrderStatus } from './types';
import {
  getOrders,
  createOrder as apiCreateOrder,
  updateOrderStatus as apiUpdateOrderStatus,
  addLog as apiAddLog,
  uploadDesignImage as apiUploadDesignImage,
  uploadFinalImage as apiUploadFinalImage,
  deleteOrder as apiDeleteOrder
} from './utils/api';
import { CreateOrderRequest } from './types';

interface OrderStore {
  orders: Order[];
  filter: OrderStatus | 'all';
  selectedOrder: Order | null;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  createOrder: (data: CreateOrderRequest) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  addLog: (orderId: string, data: { author: string; avatar: string; content: string }) => Promise<void>;
  uploadDesignImage: (orderId: string, image: string) => Promise<void>;
  uploadFinalImage: (orderId: string, image: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  setFilter: (filter: OrderStatus | 'all') => void;
  openModal: (order: Order) => void;
  closeModal: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  filter: 'all',
  selectedOrder: null,
  isModalOpen: false,
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await getOrders();
      set({ orders, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newOrder = await apiCreateOrder(data);
      set(state => ({
        orders: [newOrder, ...state.orders],
        isLoading: false
      }));
      return newOrder;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const updatedOrder = await apiUpdateOrderStatus(id, status);
      set(state => ({
        orders: state.orders.map(o => o.id === id ? updatedOrder : o),
        selectedOrder: state.selectedOrder?.id === id ? updatedOrder : state.selectedOrder
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addLog: async (orderId, data) => {
    try {
      const newLog = await apiAddLog(orderId, data);
      set(state => ({
        orders: state.orders.map(o =>
          o.id === orderId
            ? { ...o, logs: [newLog, ...o.logs], updatedAt: new Date().toISOString() }
            : o
        ),
        selectedOrder: state.selectedOrder?.id === orderId
          ? { ...state.selectedOrder, logs: [newLog, ...state.selectedOrder.logs], updatedAt: new Date().toISOString() }
          : state.selectedOrder
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  uploadDesignImage: async (orderId, image) => {
    try {
      const updatedOrder = await apiUploadDesignImage(orderId, image);
      set(state => ({
        orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
        selectedOrder: state.selectedOrder?.id === orderId ? updatedOrder : state.selectedOrder
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  uploadFinalImage: async (orderId, image) => {
    try {
      const updatedOrder = await apiUploadFinalImage(orderId, image);
      set(state => ({
        orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
        selectedOrder: state.selectedOrder?.id === orderId ? updatedOrder : state.selectedOrder
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteOrder: async (id) => {
    try {
      await apiDeleteOrder(id);
      set(state => ({
        orders: state.orders.filter(o => o.id !== id),
        selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
        isModalOpen: state.selectedOrder?.id === id ? false : state.isModalOpen
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setFilter: (filter) => set({ filter }),
  openModal: (order) => set({ selectedOrder: order, isModalOpen: true }),
  closeModal: () => set({ selectedOrder: null, isModalOpen: false })
}));
