import { Order } from '../shared/types';

type EventHandler = (...args: unknown[]) => void;

class SocketMock {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private static instance: SocketMock;

  private constructor() {}

  static getInstance(): SocketMock {
    if (!SocketMock.instance) {
      SocketMock.instance = new SocketMock();
    }
    return SocketMock.instance;
  }

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(...args);
      } catch (e) {
        console.error('Socket handler error:', e);
      }
    });

    if (event === 'new_order') {
      setTimeout(() => {
        localStorage.setItem('orderflow_new_order', JSON.stringify({
          order: args[0],
          timestamp: Date.now()
        }));
      }, 0);
    }

    if (event === 'order_complete') {
      setTimeout(() => {
        localStorage.setItem('orderflow_order_complete', JSON.stringify({
          orderId: args[0],
          timestamp: Date.now()
        }));
      }, 0);
    }
  }

  disconnect(): void {
    this.handlers.clear();
  }
}

export const socket = SocketMock.getInstance();

export const simulateNewOrder = (order: Order): void => {
  socket.emit('new_order', order);
};

export const simulateOrderComplete = (orderId: string): void => {
  socket.emit('order_complete', orderId);
};

export const startCrossTabSync = (onNewOrder: (order: Order) => void, onOrderComplete: (orderId: string) => void): () => void => {
  const checkStorage = () => {
    const newOrderData = localStorage.getItem('orderflow_new_order');
    if (newOrderData) {
      const { order, timestamp } = JSON.parse(newOrderData);
      const lastProcessed = Number(localStorage.getItem('orderflow_last_processed') || '0');
      if (timestamp > lastProcessed) {
        onNewOrder(order);
        localStorage.setItem('orderflow_last_processed', String(timestamp));
      }
    }

    const completeData = localStorage.getItem('orderflow_order_complete');
    if (completeData) {
      const { orderId, timestamp } = JSON.parse(completeData);
      const lastProcessed = Number(localStorage.getItem('orderflow_last_complete_processed') || '0');
      if (timestamp > lastProcessed) {
        onOrderComplete(orderId);
        localStorage.setItem('orderflow_last_complete_processed', String(timestamp));
      }
    }
  };

  const intervalId = setInterval(checkStorage, 2000);
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'orderflow_new_order') {
      checkStorage();
    }
  });

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('storage', checkStorage);
  };
};
