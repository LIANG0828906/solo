import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SelectedFlower, WrappingStyle, RibbonColor, Order } from '@/types';
import { FLOWERS, WRAPPING_OPTIONS, RIBBON_PRICE, WRAPPING_PRICE } from '@/data/flowers';

interface BouquetState {
  selectedFlowers: SelectedFlower[];
  wrappingStyle: WrappingStyle;
  ribbonColor: RibbonColor;
  orders: Order[];

  addFlower: (flowerId: string) => void;
  removeFlower: (flowerId: string) => void;
  updateFlowerQuantity: (flowerId: string, quantity: number) => void;
  setWrappingStyle: (style: WrappingStyle) => void;
  setRibbonColor: (color: RibbonColor) => void;
  submitOrder: () => Order | null;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
}

const loadOrders = (): Order[] => {
  try {
    const saved = localStorage.getItem('bouquet-orders');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveOrders = (orders: Order[]) => {
  localStorage.setItem('bouquet-orders', JSON.stringify(orders.slice(0, 50)));
};

export const useBouquetStore = create<BouquetState>((set, get) => ({
  selectedFlowers: [],
  wrappingStyle: 'plain-white',
  ribbonColor: 'gold',
  orders: loadOrders(),

  addFlower: (flowerId: string) => {
    set((state) => {
      const existing = state.selectedFlowers.find((f) => f.flowerId === flowerId);
      if (existing) {
        return {
          selectedFlowers: state.selectedFlowers.map((f) =>
            f.flowerId === flowerId ? { ...f, quantity: f.quantity + 1 } : f
          ),
        };
      }
      return {
        selectedFlowers: [...state.selectedFlowers, { flowerId, quantity: 1 }],
      };
    });
  },

  removeFlower: (flowerId: string) => {
    set((state) => ({
      selectedFlowers: state.selectedFlowers.filter((f) => f.flowerId !== flowerId),
    }));
  },

  updateFlowerQuantity: (flowerId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFlower(flowerId);
      return;
    }
    set((state) => ({
      selectedFlowers: state.selectedFlowers.map((f) =>
        f.flowerId === flowerId ? { ...f, quantity } : f
      ),
    }));
  },

  setWrappingStyle: (style: WrappingStyle) => {
    set({ wrappingStyle: style });
  },

  setRibbonColor: (color: RibbonColor) => {
    set({ ribbonColor: color });
  },

  calculateSubtotal: () => {
    const { selectedFlowers } = get();
    return selectedFlowers.reduce((sum, sf) => {
      const flower = FLOWERS.find((f) => f.id === sf.flowerId);
      return sum + (flower ? flower.price * sf.quantity : 0);
    }, 0);
  },

  calculateTotal: () => {
    const subtotal = get().calculateSubtotal();
    return subtotal + WRAPPING_PRICE + RIBBON_PRICE;
  },

  submitOrder: () => {
    const { selectedFlowers, wrappingStyle, ribbonColor } = get();
    if (selectedFlowers.length === 0) return null;

    const order: Order = {
      orderId: uuidv4().slice(0, 8).toUpperCase(),
      flowers: selectedFlowers.map((sf) => {
        const flower = FLOWERS.find((f) => f.id === sf.flowerId)!;
        return { name: flower.name, quantity: sf.quantity };
      }),
      wrappingStyle,
      ribbonColor,
      totalPrice: get().calculateTotal(),
      timestamp: new Date().toLocaleString('zh-CN'),
    };

    set((state) => {
      const newOrders = [order, ...state.orders].slice(0, 5);
      saveOrders(newOrders);
      return { orders: newOrders, selectedFlowers: [] };
    });

    return order;
  },
}));
