import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Subscription, Category } from '@/utils/dateUtils';
import { getDaysUntilExpiry, getEffectiveMonthlyFee } from '@/utils/dateUtils';

export type FilterType = 'all' | 'expiring' | 'expired';
export type CategoryFilterType = 'all' | Category;
export type SortType = 'expiry' | 'expiryDesc' | 'fee' | 'feeDesc' | 'name';

interface SubscriptionState {
  subscriptions: Subscription[];
  filter: FilterType;
  categoryFilter: CategoryFilterType;
  sortBy: SortType;
  showNotification: boolean;
  notificationMessage: string;
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  setFilter: (filter: FilterType) => void;
  setCategoryFilter: (filter: CategoryFilterType) => void;
  setSortBy: (sort: SortType) => void;
  triggerNotification: (message: string) => void;
  hideNotification: () => void;
  getFilteredSubscriptions: () => Subscription[];
  getExpiringCount: () => number;
  getTotalMonthlyFee: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      filter: 'all',
      categoryFilter: 'all',
      sortBy: 'expiry',
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
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setSortBy: (sortBy) => set({ sortBy }),

      triggerNotification: (message) =>
        set({ showNotification: true, notificationMessage: message }),

      hideNotification: () => set({ showNotification: false, notificationMessage: '' }),

      getExpiringCount: () => {
        return get().subscriptions.filter((sub) => {
          const days = getDaysUntilExpiry(sub);
          return days >= 0 && days <= 7;
        }).length;
      },

      getTotalMonthlyFee: () => {
        return get().subscriptions.reduce(
          (total, sub) => total + getEffectiveMonthlyFee(sub),
          0
        );
      },

      getFilteredSubscriptions: () => {
        const { subscriptions, filter, categoryFilter, sortBy } = get();

        let result = [...subscriptions];

        if (filter !== 'all') {
          result = result.filter((sub) => {
            const days = getDaysUntilExpiry(sub);
            if (filter === 'expiring') return days >= 0 && days <= 7;
            if (filter === 'expired') return days < 0;
            return true;
          });
        }

        if (categoryFilter !== 'all') {
          result = result.filter((sub) => sub.category === categoryFilter);
        }

        result.sort((a, b) => {
          switch (sortBy) {
            case 'expiry':
              return getDaysUntilExpiry(a) - getDaysUntilExpiry(b);
            case 'expiryDesc':
              return getDaysUntilExpiry(b) - getDaysUntilExpiry(a);
            case 'fee':
              return getEffectiveMonthlyFee(a) - getEffectiveMonthlyFee(b);
            case 'feeDesc':
              return getEffectiveMonthlyFee(b) - getEffectiveMonthlyFee(a);
            case 'name':
              return a.name.localeCompare(b.name, 'zh-CN');
            default:
              return 0;
          }
        });

        return result;
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        filter: state.filter,
        categoryFilter: state.categoryFilter,
        sortBy: state.sortBy,
      }),
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
