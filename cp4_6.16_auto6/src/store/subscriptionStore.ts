import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Subscription } from '@/types';
import { loadAllSubscriptions, saveSubscription, deleteSubscription as dbDelete, saveAllSubscriptions } from '@/utils/db';
import { startExpiryCheck, stopExpiryCheck } from '@/utils/notification';

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Omit<Subscription, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  importSubscriptions: (data: Subscription[]) => Promise<void>;
  exportSubscriptions: () => Subscription[];
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: true,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      const subs = await loadAllSubscriptions();
      set({ subscriptions: subs, loading: false, initialized: true });
      startExpiryCheck(() => get().subscriptions);
    } catch {
      set({ loading: false, initialized: true });
    }
  },

  addSubscription: async (sub) => {
    const now = new Date().toISOString();
    const newSub: Subscription = {
      ...sub,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await saveSubscription(newSub);
    set((state) => ({ subscriptions: [...state.subscriptions, newSub] }));
  },

  updateSubscription: async (id, data) => {
    const state = get();
    const existing = state.subscriptions.find((s) => s.id === id);
    if (!existing) return;
    const updated: Subscription = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await saveSubscription(updated);
    set((state) => ({
      subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
    }));
  },

  deleteSubscription: async (id) => {
    await dbDelete(id);
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    }));
  },

  importSubscriptions: async (data) => {
    const existing = get().subscriptions;
    const existingMap = new Map(existing.map((s) => [s.id, s]));
    for (const sub of data) {
      existingMap.set(sub.id, sub);
    }
    const merged = Array.from(existingMap.values());
    await saveAllSubscriptions(merged);
    set({ subscriptions: merged });
  },

  exportSubscriptions: () => {
    return get().subscriptions;
  },
}));

if (typeof window !== 'undefined') {
  stopExpiryCheck();
}
