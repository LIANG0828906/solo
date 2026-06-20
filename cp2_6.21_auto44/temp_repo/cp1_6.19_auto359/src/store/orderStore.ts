import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { Order, OrderStatus, Station, StationType } from '../types';

interface OrderStore {
  orders: Order[];
  draggingOrder: Order | null;
  dragOverArea: OrderStatus | null;
  stations: Station[];
  socket: Socket | null;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  setDragging: (order: Order | null) => void;
  setDragOverArea: (area: OrderStatus | null) => void;
  setStations: (stations: Station[]) => void;
  moveOrder: (orderId: string, newStatus: OrderStatus, newIndex: number) => void;
  lockOrderToStation: (orderId: string, stationType: StationType) => void;
  initSocket: () => () => void;
  tickOrders: (updates: { id: string; remainingTime: number; status?: OrderStatus }[]) => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  draggingOrder: null,
  dragOverArea: null,
  stations: [],
  socket: null,

  setOrders: (orders) => {
    const seen = new Set<string>();
    const unique = orders.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    set({ orders: unique });
  },

  addOrder: (order) =>
    set((state) => {
      if (state.orders.some((o) => o.id === order.id)) return state;
      return { orders: [order, ...state.orders] };
    }),

  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  removeOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    })),

  setDragging: (order) => set({ draggingOrder: order }),

  setDragOverArea: (area) => set({ dragOverArea: area }),

  setStations: (stations) => set({ stations }),

  moveOrder: (orderId, newStatus, newIndex) => {
    const { socket, orders } = get();
    if (socket) {
      socket.emit('order:move', { orderId, newStatus, newIndex });
    }
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const filtered = orders.filter((o) => o.id !== orderId);
    const sameStatus = filtered.filter((o) => o.status === newStatus);
    const others = filtered.filter((o) => o.status !== newStatus);
    const updatedOrder = {
      ...order,
      status: newStatus,
      remainingTime: newStatus === 'completed' ? 0 : order.remainingTime,
    };
    sameStatus.splice(newIndex, 0, updatedOrder);
    set({ orders: [...others, ...sameStatus] });
  },

  lockOrderToStation: async (orderId, stationType) => {
    try {
      await fetch(`/api/stations/${stationType}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
    } catch (e) {
      console.error('Lock order failed:', e);
    }
  },

  tickOrders: (updates) =>
    set((state) => ({
      orders: state.orders.map((o) => {
        const update = updates.find((u) => u.id === o.id);
        if (update) {
          return {
            ...o,
            remainingTime: update.remainingTime,
            status: update.status ?? o.status,
          };
        }
        return o;
      }),
    })),

  initSocket: () => {
    const existing = get().socket;
    if (existing && existing.connected) {
      return () => {};
    }
    if (existing) {
      existing.disconnect();
    }

    const socket = io({ path: '/socket.io' });

    socket.on('orders:initial', (orders: Order[]) => {
      const seen = new Set<string>();
      const unique = orders.filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      set({ orders: unique });
    });

    socket.on('order:created', (order: Order) => {
      set((state) => {
        if (state.orders.some((o) => o.id === order.id)) return state;
        return { orders: [order, ...state.orders] };
      });
    });

    socket.on('order:updated', (order: Order) => {
      set((state) => {
        const exists = state.orders.some((o) => o.id === order.id);
        if (!exists) {
          return { orders: [order, ...state.orders] };
        }
        return {
          orders: state.orders.map((o) => (o.id === order.id ? order : o)),
        };
      });
    });

    socket.on('order:deleted', (id: string) => {
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
      }));
    });

    socket.on('orders:tick', (updates: { id: string; remainingTime: number; status?: OrderStatus }[]) => {
      set((state) => ({
        orders: state.orders.map((o) => {
          const update = updates.find((u) => u.id === o.id);
          if (update) {
            return {
              ...o,
              remainingTime: update.remainingTime,
              status: update.status ?? o.status,
            };
          }
          return o;
        }),
      }));
    });

    socket.on('stations:updated', (stations: Station[]) => {
      set({ stations });
    });

    set({ socket });

    return () => {
      socket.disconnect();
      set({ socket: null });
    };
  },
}));
