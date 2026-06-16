import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CartItem, Order, OrderStatus, MenuItem } from '../shared/types';
import { addOrder } from '../utils/indexedDB';
import { simulateNewOrder } from '../utils/socketMock';

interface CartStoreState {
  cartItems: CartItem[];
  totalAmount: number;
  orderStatus: 'idle' | 'submitting' | 'success' | 'error';
  currentOrder: Order | null;
  
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotal: () => number;
  submitOrder: () => Promise<Order | null>;
}

export const useCartStore = create<CartStoreState>((set, get) => ({
  cartItems: [],
  totalAmount: 0,
  orderStatus: 'idle',
  currentOrder: null,

  addItem: (menuItem: MenuItem) => {
    const cartItems = get().cartItems;
    const existingItem = cartItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      const updatedItems = cartItems.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      set({
        cartItems: updatedItems,
        totalAmount: get().calculateTotal()
      });
    } else {
      const newItem: CartItem = {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unitPrice: menuItem.price,
        emoji: menuItem.emoji
      };
      const updatedItems = [...cartItems, newItem];
      set({
        cartItems: updatedItems,
        totalAmount: get().calculateTotal()
      });
    }
  },

  removeItem: (menuItemId: string) => {
    const updatedItems = get().cartItems.filter(item => item.menuItemId !== menuItemId);
    set({
      cartItems: updatedItems,
      totalAmount: get().calculateTotal()
    });
  },

  updateQuantity: (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    
    const updatedItems = get().cartItems.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, quantity }
        : item
    );
    set({
      cartItems: updatedItems,
      totalAmount: get().calculateTotal()
    });
  },

  clearCart: () => {
    set({
      cartItems: [],
      totalAmount: 0,
      orderStatus: 'idle',
      currentOrder: null
    });
  },

  calculateTotal: () => {
    return get().cartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  },

  submitOrder: async () => {
    const cartItems = get().cartItems;
    if (cartItems.length === 0) return null;

    set({ orderStatus: 'submitting' });

    const totalAmount = get().calculateTotal();
    const now = Date.now();
    const date = new Date(now);
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNo = `OF-${dateStr}-${randomPart}`;

    const order: Order = {
      id: uuidv4(),
      orderNo,
      createdAt: now,
      totalAmount,
      status: OrderStatus.PENDING,
      estimatedTime: now + 8 * 60 * 1000,
      items: [...cartItems]
    };

    try {
      await addOrder(order);
      simulateNewOrder(order);
      
      set({
        orderStatus: 'success',
        currentOrder: order,
        cartItems: [],
        totalAmount: 0
      });

      return order;
    } catch (error) {
      console.error('Failed to submit order:', error);
      set({ orderStatus: 'error' });
      return null;
    }
  }
}));

export default useCartStore;
