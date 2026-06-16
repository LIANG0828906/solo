import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MenuItem, CartItem, Order, OrderStatus, Role, ToastMessage, Category } from '../shared/types';
import {
  getAllMenuItems,
  updateMenuItem as dbUpdateMenuItem,
  addOrder as dbAddOrder,
  updateOrderStatus as dbUpdateOrderStatus,
  getOrdersByStatus,
  getOrderById
} from '../utils/indexedDB';
import { simulateNewOrder, simulateOrderComplete } from '../utils/socketMock';

interface AppState {
  currentRole: Role;
  menuItems: MenuItem[];
  cartItems: CartItem[];
  pendingOrders: Order[];
  completedOrders: Order[];
  currentOrder: Order | null;
  toasts: ToastMessage[];
  isLoading: boolean;
  
  setCurrentRole: (role: Role) => void;
  loadMenuItems: () => Promise<void>;
  addToCart: (menuItem: MenuItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartItemQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  submitOrder: () => Promise<Order | null>;
  loadOrders: () => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  restockItem: (itemId: string) => Promise<void>;
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  setCurrentOrderById: (orderId: string) => Promise<void>;
  handleNewOrder: (order: Order) => void;
  handleOrderComplete: (orderId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'customer',
  menuItems: [],
  cartItems: [],
  pendingOrders: [],
  completedOrders: [],
  currentOrder: null,
  toasts: [],
  isLoading: false,

  setCurrentRole: (role: Role) => set({ currentRole: role }),

  loadMenuItems: async () => {
    set({ isLoading: true });
    try {
      const items = await getAllMenuItems();
      set({ menuItems: items, isLoading: false });
    } catch (error) {
      console.error('Failed to load menu:', error);
      set({ isLoading: false });
    }
  },

  addToCart: (menuItem: MenuItem) => {
    const cartItems = get().cartItems;
    const existingItem = cartItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      set({
        cartItems: cartItems.map(item =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      set({
        cartItems: [...cartItems, {
          menuItemId: menuItem.id,
          name: menuItem.name,
          quantity: 1,
          unitPrice: menuItem.price,
          emoji: menuItem.emoji
        }]
      });
    }
  },

  removeFromCart: (menuItemId: string) => {
    set({
      cartItems: get().cartItems.filter(item => item.menuItemId !== menuItemId)
    });
  },

  updateCartItemQuantity: (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(menuItemId);
      return;
    }
    
    set({
      cartItems: get().cartItems.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity }
          : item
      )
    });
  },

  clearCart: () => set({ cartItems: [] }),

  getCartTotal: () => {
    return get().cartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  },

  getCartItemCount: () => {
    return get().cartItems.reduce((count, item) => count + item.quantity, 0);
  },

  submitOrder: async () => {
    const cartItems = get().cartItems;
    if (cartItems.length === 0) return null;

    const totalAmount = get().getCartTotal();
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
      await dbAddOrder(order);
      simulateNewOrder(order);
      get().clearCart();
      set({ currentOrder: order });
      get().addToast('订单提交成功！', 'success');
      return order;
    } catch (error) {
      console.error('Failed to submit order:', error);
      get().addToast('订单提交失败，请重试', 'error');
      return null;
    }
  },

  loadOrders: async () => {
    set({ isLoading: true });
    try {
      const [pending, completed] = await Promise.all([
        getOrdersByStatus(OrderStatus.PENDING),
        getOrdersByStatus(OrderStatus.COMPLETED)
      ]);
      set({
        pendingOrders: pending,
        completedOrders: completed.slice(0, 5),
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load orders:', error);
      set({ isLoading: false });
    }
  },

  completeOrder: async (orderId: string) => {
    try {
      await dbUpdateOrderStatus(orderId, OrderStatus.COMPLETED);
      simulateOrderComplete(orderId);
      
      const pendingOrders = get().pendingOrders;
      const completedOrder = pendingOrders.find(o => o.id === orderId);
      
      if (completedOrder) {
        const updatedOrder = { ...completedOrder, status: OrderStatus.COMPLETED };
        const newCompleted = [updatedOrder, ...get().completedOrders].slice(0, 5);
        
        set({
          pendingOrders: pendingOrders.filter(o => o.id !== orderId),
          completedOrders: newCompleted
        });
      }
      
      get().addToast('订单已完成', 'success');
    } catch (error) {
      console.error('Failed to complete order:', error);
      get().addToast('操作失败，请重试', 'error');
    }
  },

  updateMenuItem: async (item: MenuItem) => {
    try {
      await dbUpdateMenuItem(item);
      set({
        menuItems: get().menuItems.map(i => i.id === item.id ? item : i)
      });
      get().addToast('保存成功', 'success');
    } catch (error) {
      console.error('Failed to update menu item:', error);
      get().addToast('保存失败，请重试', 'error');
    }
  },

  restockItem: async (itemId: string) => {
    const item = get().menuItems.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem = { ...item, stock: item.stock + 100 };
    await get().updateMenuItem(updatedItem);
  },

  addToast: (message: string, type: ToastMessage['type']) => {
    const id = uuidv4();
    const toast: ToastMessage = { id, message, type };
    set({ toasts: [...get().toasts, toast] });
    
    setTimeout(() => {
      get().removeToast(id);
    }, 2500);
  },

  removeToast: (id: string) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  setCurrentOrderById: async (orderId: string) => {
    try {
      const order = await getOrderById(orderId);
      set({ currentOrder: order || null });
    } catch (error) {
      console.error('Failed to load order:', error);
      set({ currentOrder: null });
    }
  },

  handleNewOrder: (order: Order) => {
    const existing = get().pendingOrders.find(o => o.id === order.id);
    if (!existing) {
      set({
        pendingOrders: [...get().pendingOrders, order]
      });
    }
  },

  handleOrderComplete: (orderId: string) => {
    const pendingOrders = get().pendingOrders;
    const completedOrder = pendingOrders.find(o => o.id === orderId);
    
    if (completedOrder) {
      const updatedOrder = { ...completedOrder, status: OrderStatus.COMPLETED };
      const newCompleted = [updatedOrder, ...get().completedOrders].slice(0, 5);
      
      set({
        pendingOrders: pendingOrders.filter(o => o.id !== orderId),
        completedOrders: newCompleted
      });
    }
  }
}));

export const useFilteredMenuItems = (category: Category) => {
  const menuItems = useAppStore(state => state.menuItems);
  
  if (category === 'all') {
    return menuItems.filter(item => item.enabled);
  }
  
  return menuItems.filter(item => item.enabled && item.category === category);
};

export const useLowStockItems = () => {
  const menuItems = useAppStore(state => state.menuItems);
  return menuItems.filter(item => item.enabled && item.stock < 10);
};
