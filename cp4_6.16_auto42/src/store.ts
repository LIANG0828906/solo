import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import { format, parseISO } from 'date-fns';
import type { CoffeeRecord, TagFrequency, MonthlyStat } from './types';

interface CoffeeStore {
  records: CoffeeRecord[];
  tagFrequency: TagFrequency;
  monthlyStats: MonthlyStat[];
  isLoading: boolean;
  init: () => Promise<void>;
  addRecord: (data: Omit<CoffeeRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  updateRecord: (id: string, data: Partial<CoffeeRecord>) => Promise<void>;
}

const DB_KEY = 'coffee_passport_records';

function computeDerived(records: CoffeeRecord[]): {
  tagFrequency: TagFrequency;
  monthlyStats: MonthlyStat[];
} {
  const tagFrequency: TagFrequency = {};
  const monthMap: { [key: string]: number } = {};

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    for (let j = 0; j < r.flavorTags.length; j++) {
      const t = r.flavorTags[j];
      tagFrequency[t] = (tagFrequency[t] || 0) + 1;
    }
    try {
      const monthKey = format(parseISO(r.createdAt), 'yyyy-MM');
      monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
    } catch (_e) {
      // skip invalid
    }
  }

  const monthlyStats: MonthlyStat[] = Object.keys(monthMap)
    .sort()
    .map((m) => ({ month: m, count: monthMap[m] }));

  return { tagFrequency, monthlyStats };
}

export const useCoffeeStore = create<CoffeeStore>((set, get) => ({
  records: [],
  tagFrequency: {},
  monthlyStats: [],
  isLoading: true,

  init: async () => {
    try {
      const saved = await get<CoffeeRecord[]>(DB_KEY);
      const records = Array.isArray(saved) ? saved : [];
      const derived = computeDerived(records);
      set({ records, ...derived, isLoading: false });
    } catch (_e) {
      set({ records: [], tagFrequency: {}, monthlyStats: [], isLoading: false });
    }
  },

  addRecord: async (data) => {
    const newRecord: CoffeeRecord = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    const next = [newRecord, ...get().records];
    const derived = computeDerived(next);
    set({ records: next, ...derived });
    try {
      await set(DB_KEY, next);
    } catch (_e) {
      // persistence failure is non-fatal to UI
    }
  },

  deleteRecord: async (id) => {
    const next = get().records.filter((r) => r.id !== id);
    const derived = computeDerived(next);
    set({ records: next, ...derived });
    try {
      await set(DB_KEY, next);
    } catch (_e) {
      // no-op
    }
  },

  updateRecord: async (id, data) => {
    const next = get().records.map((r) =>
      r.id === id ? { ...r, ...data } : r
    );
    const derived = computeDerived(next);
    set({ records: next, ...derived });
    try {
      await set(DB_KEY, next);
    } catch (_e) {
      // no-op
    }
  }
}));
