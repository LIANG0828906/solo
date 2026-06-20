import { create } from 'zustand';
import type { CartItem, MenuItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartBounce: boolean;
  triggerBounce: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isCartOpen: false,
  cartBounce: false,

  addItem: (menuItem: MenuItem) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.menuItemId === menuItem.id
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.menuItemId === menuItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            image_url: menuItem.image_url,
          },
        ],
      };
    });

    get().triggerBounce();
  },

  removeItem: (menuItemId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.menuItemId !== menuItemId),
    }));
  },

  updateQuantity: (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [], isCartOpen: false });
  },

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  setCartOpen: (open: boolean) => {
    set({ isCartOpen: open });
  },

  triggerBounce: () => {
    set({ cartBounce: true });
    setTimeout(() => set({ cartBounce: false }), 200);
  },
}));
