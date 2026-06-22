import { useState, useEffect } from 'react';
import { Order } from '../shared/types';
import { socket } from '../utils/socketMock';
import { useAppStore } from '../store/useAppStore';

class OrderManager {
  private static instance: OrderManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): OrderManager {
    if (!OrderManager.instance) {
      OrderManager.instance = new OrderManager();
    }
    return OrderManager.instance;
  }

  init(): void {
    if (this.isInitialized) return;
    
    socket.on('new_order', (...args: unknown[]) => {
      const order = args[0] as Order;
      const store = useAppStore.getState();
      const existing = store.pendingOrders.find(o => o.id === order.id);
      if (!existing) {
        store.handleNewOrder(order);
      }
    });

    socket.on('order_complete', (...args: unknown[]) => {
      const orderId = args[0] as string;
      const store = useAppStore.getState();
      store.handleOrderComplete(orderId);
    });

    this.isInitialized = true;
  }

  assignEstimatedTime(createdAt: number): number {
    return createdAt + 8 * 60 * 1000;
  }

  getPendingOrders(): Order[] {
    return useAppStore.getState().pendingOrders;
  }

  getCompletedOrders(): Order[] {
    return useAppStore.getState().completedOrders;
  }

  async completeOrder(orderId: string): Promise<void> {
    await useAppStore.getState().completeOrder(orderId);
  }

  calculateRemainingTime(estimatedTime: number): number {
    return Math.max(0, estimatedTime - Date.now());
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatCountdown(remainingMs: number): string {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  isOverdue(estimatedTime: number): boolean {
    return Date.now() > estimatedTime;
  }
}

export const orderManager = OrderManager.getInstance();

export const useOrderCountdown = (estimatedTime: number) => {
  const [remaining, setRemaining] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const rem = Math.max(0, estimatedTime - now);
      setRemaining(rem);
      setIsOverdue(now > estimatedTime);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [estimatedTime]);

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { remaining, isOverdue, formatted };
};
