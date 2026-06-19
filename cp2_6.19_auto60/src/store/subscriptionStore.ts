import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Subscription, Category } from '@/utils/dateUtils';
import { getDaysUntilExpiry } from '@/utils/dateUtils';

export type FilterType = 'all' | 'expiring' | 'expired';

interface SubscriptionState {
  subscriptions: Subscription[];
  filter: FilterType;
  showNotification: boolean;
  notificationMessage: string;
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  setFilter: (filter: FilterType) => void;
  triggerNotification: (message: string) => void;
  hideNotification: () => void;
  getFilteredSubscriptions: () => Subscription[];
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      filter: 'all',
      showNotification: false,
      notificationMessage: '',

      addSubscription: (sub) =>
        set((state) => ({
          subscriptions: [...state.subscriptions, { ...sub, id: uuidv4() }],
        })),

      updateSubscription: (id, updates) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        })),

      setFilter: (filter) => set({ filter }),

      triggerNotification: (message) =>
        set({ showNotification: true, notificationMessage: message }),

      hideNotification: () => set({ showNotification: false, notificationMessage: '' }),

      getFilteredSubscriptions: () => {
        const { subscriptions, filter } = get();
        if (filter === 'all') return subscriptions;

        return subscriptions.filter((sub) => {
          const days = getDaysUntilExpiry(sub);
          if (filter === 'expiring') return days >= 0 && days <= 7;
          if (filter === 'expired') return days < 0;
          return true;
        });
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({ subscriptions: state.subscriptions }),
    }
  )
);

export function getCategoryName(category: Category): string {
  const names: Record<Category, string> = {
    entertainment: '娱乐',
    office: '办公',
    cloud: '云服务',
    music: '音乐',
    other: '其他',
  };
  return names[category];
}

export function getBillingCycleName(cycle: 'monthly' | 'yearly'): string {
  return cycle === 'monthly' ? '月付' : '年付';
}
