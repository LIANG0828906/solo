import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Product, UsageLog, Settings, ProductFormData } from '@/types';
import { getTodayString } from '@/utils/dateUtils';

interface AppState {
  products: Product[];
  usageLogs: UsageLog[];
  settings: Settings;
  addProduct: (data: ProductFormData) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addUsageLog: (productId: string, amount: number, date?: string) => void;
  updateSettings: (updates: Partial<Settings>) => void;
}

const initialSettings: Settings = {
  reminderTime: '21:00',
  notificationEnabled: false,
  lastReminderDate: '',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      products: [],
      usageLogs: [],
      settings: initialSettings,

      addProduct: (data) => {
        const now = new Date().toISOString();
        const newProduct: Product = {
          id: uuidv4(),
          ...data,
          usedAmount: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          products: [newProduct, ...state.products],
        }));
      },

      updateProduct: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          usageLogs: state.usageLogs.filter((log) => log.productId !== id),
        }));
      },

      addUsageLog: (productId, amount, date) => {
        const now = new Date().toISOString();
        const logDate = date || getTodayString();

        const newLog: UsageLog = {
          id: uuidv4(),
          productId,
          amount,
          date: logDate,
          createdAt: now,
        };

        set((state) => {
          const product = state.products.find((p) => p.id === productId);
          if (!product) return state;

          const newUsedAmount = Math.min(product.capacity, product.usedAmount + amount);

          return {
            usageLogs: [newLog, ...state.usageLogs],
            products: state.products.map((p) =>
              p.id === productId
                ? { ...p, usedAmount: newUsedAmount, updatedAt: now }
                : p
            ),
          };
        });
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
    }),
    {
      name: 'skincare-inventory-storage',
      partialize: (state) => ({
        products: state.products,
        usageLogs: state.usageLogs,
        settings: state.settings,
      }),
    }
  )
);

export const useProductById = (id: string) => {
  return useStore((state) => state.products.find((p) => p.id === id));
};

export const useProducts = () => {
  return useStore((state) => state.products);
};

export const useUsageLogs = () => {
  return useStore((state) => state.usageLogs);
};

export const useSettings = () => {
  return useStore((state) => state.settings);
};

export const useProductUsageLogs = (productId: string) => {
  return useStore((state) =>
    state.usageLogs.filter((log) => log.productId === productId)
  );
};
