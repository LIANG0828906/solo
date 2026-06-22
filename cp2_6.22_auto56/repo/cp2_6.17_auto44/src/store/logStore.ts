import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BrewRecord, StatsData, ToastItem, ConcentrationTag } from '../types';
import {
  getAllRecords,
  addRecordDB,
  deleteRecordDB,
  bulkAddRecordsDB,
} from '../db';
import { getConcentrationTag } from '../utils/ratio';

interface LogState {
  records: BrewRecord[];
  toasts: ToastItem[];
  initialized: boolean;
  init: () => Promise<void>;
  addRecord: (data: Omit<BrewRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  editRecord: (id: string, data: Omit<BrewRecord, 'id' | 'createdAt'>) => Promise<void>;
  importRecords: (data: Omit<BrewRecord, 'id' | 'createdAt'>[]) => Promise<{ skipped: number[] }>;
  getStats: () => StatsData;
  getMonthlyStats: () => Array<{ date: string; count: number; avgRating: number }>;
  showToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  records: [],
  toasts: [],
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const records = await getAllRecords();
    const needMigrate: BrewRecord[] = [];
    records.forEach((r) => {
      if (!r.concentrationTag) {
        const ratio = r.coffeeWeight > 0 ? r.waterWeight / r.coffeeWeight : null;
        const tag = getConcentrationTag(ratio) || '均衡';
        r.concentrationTag = tag as ConcentrationTag;
        needMigrate.push(r);
      }
    });
    if (needMigrate.length > 0) {
      await bulkAddRecordsDB(needMigrate);
    }
    records.sort((a, b) => b.createdAt - a.createdAt);
    set({ records, initialized: true });
  },

  addRecord: async (data) => {
    const record: BrewRecord = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    await addRecordDB(record);
    set((state) => ({
      records: [record, ...state.records].sort((a, b) => b.createdAt - a.createdAt),
    }));
  },

  deleteRecord: async (id) => {
    await deleteRecordDB(id);
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    }));
  },

  editRecord: async (id, data) => {
    const existing = get().records.find((r) => r.id === id);
    if (!existing) return;
    const updated: BrewRecord = {
      ...existing,
      ...data,
      createdAt: Date.now(),
    };
    await addRecordDB(updated);
    set((state) => ({
      records: state.records
        .map((r) => (r.id === id ? updated : r))
        .sort((a, b) => b.createdAt - a.createdAt),
    }));
  },

  importRecords: async (dataList) => {
    const currentRecords = get().records;
    const skipped: number[] = [];
    const toAdd: BrewRecord[] = [];

    const dedupMap = new Map<string, BrewRecord>();
    for (const r of currentRecords) {
      const dedupKey = `${r.date}_${r.bean}`;
      dedupMap.set(dedupKey, r);
    }

    dataList.forEach((data, index) => {
      const lineNum = index + 1;
      if (
        !data.date ||
        !data.bean ||
        !data.roast ||
        data.grind == null ||
        data.temp == null ||
        !data.method ||
        !data.duration ||
        data.coffeeWeight == null ||
        data.waterWeight == null ||
        data.rating == null
      ) {
        skipped.push(lineNum);
        return;
      }

      const dedupKey = `${data.date}_${data.bean}`;
      const existing = dedupMap.get(dedupKey);
      const record: BrewRecord = {
        ...data,
        id: existing ? existing.id : uuidv4(),
        createdAt: Date.now(),
      };
      dedupMap.set(dedupKey, record);
      toAdd.push(record);
    });

    await bulkAddRecordsDB(toAdd);
    const finalRecords = Array.from(dedupMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    set({ records: finalRecords });
    return { skipped };
  },

  getStats: () => {
    const records = get().records;
    const totalRecords = records.length;

    let avgRating = 0;
    if (totalRecords > 0) {
      const sum = records.reduce((acc, r) => acc + r.rating, 0);
      avgRating = sum / totalRecords;
    }

    let mostUsedBean = '';
    if (totalRecords > 0) {
      const beanCount = new Map<string, number>();
      records.forEach((r) => {
        beanCount.set(r.bean, (beanCount.get(r.bean) || 0) + 1);
      });
      let maxCount = 0;
      for (const [bean, count] of beanCount.entries()) {
        if (count > maxCount) {
          maxCount = count;
          mostUsedBean = bean;
        }
      }
    }

    return {
      totalRecords,
      avgRating: Math.round(avgRating * 100000) / 100000,
      mostUsedBean,
      last30Days: get().getMonthlyStats(),
    };
  },

  getMonthlyStats: () => {
    const records = get().records;
    const result: Array<{ date: string; count: number; avgRating: number }> = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ date: dateStr, count: 0, avgRating: 0 });
    }

    const map = new Map<string, { count: number; ratingSum: number }>();
    result.forEach((r) => map.set(r.date, { count: 0, ratingSum: 0 }));

    records.forEach((r) => {
      const dateStr = r.date;
      const entry = map.get(dateStr);
      if (entry) {
        entry.count += 1;
        entry.ratingSum += r.rating;
      }
    });

    result.forEach((r) => {
      const entry = map.get(r.date)!;
      r.count = entry.count;
      r.avgRating = entry.count > 0 ? entry.ratingSum / entry.count : 0;
    });

    return result;
  },

  showToast: (message, type = 'info') => {
    const id = uuidv4();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 2000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
