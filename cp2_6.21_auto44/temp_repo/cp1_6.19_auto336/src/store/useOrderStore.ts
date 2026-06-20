import { create } from 'zustand';
import type { Order, ChatMessage, User, Notification } from '../types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  messages: ChatMessage[];
  user: User;
  notifications: Notification[];

  setOrders: (orders: Order[]) => void;
  setCurrentOrder: (order: Order | null) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;

  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  messages: [],
  user: {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    name: '用户' + Math.floor(Math.random() * 1000),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
  },
  notifications: [],

  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (updatedOrder) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      currentOrder: state.currentOrder?.id === updatedOrder.id ? updatedOrder : state.currentOrder,
    })),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  addNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
