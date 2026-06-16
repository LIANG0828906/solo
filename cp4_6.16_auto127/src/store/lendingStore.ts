import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { LendingRecord, DriftRoutePoint } from '../types';

interface LendingStore {
  records: LendingRecord[];
  addRecord: (record: LendingRecord) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<LendingRecord>) => Promise<void>;
  getRecordsByBookId: (bookId: string) => LendingRecord[];
  getActiveRecords: () => LendingRecord[];
  getOverdueRecords: () => LendingRecord[];
  getDriftRoute: (bookId: string) => DriftRoutePoint[];
  getDriftingBooksCount: () => number;
}

const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

export const useLendingStore = create<LendingStore>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: async (record) => {
        set((state) => ({ records: [...state.records, record] }));
      },

      updateRecord: async (recordId, updates) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.recordId === recordId ? { ...r, ...updates } : r
          ),
        }));
      },

      getRecordsByBookId: (bookId) => {
        return get()
          .records.filter((r) => r.bookId === bookId)
          .sort((a, b) => a.borrowDate - b.borrowDate);
      },

      getActiveRecords: () => {
        return get().records.filter((r) => r.returnDate === null);
      },

      getOverdueRecords: () => {
        const now = Date.now();
        return get().records.filter(
          (r) => r.returnDate === null && r.dueDate < now
        );
      },

      getDriftRoute: (bookId) => {
        const records = get().getRecordsByBookId(bookId);
        return records.map((r) => ({
          borrowerName: r.borrowerName,
          date: r.borrowDate,
          location: r.location,
        }));
      },

      getDriftingBooksCount: () => {
        const activeRecords = get().records.filter((r) => r.returnDate === null && r.isDrifting);
        const bookIds = new Set(activeRecords.map((r) => r.bookId));
        return bookIds.size;
      },
    }),
    {
      name: 'pageturner-lending',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.records.length === 0) {
          const now = Date.now();
          state.records = [
            {
              recordId: 'record-1',
              bookId: 'book-sample-2',
              borrowerName: '张三',
              borrowDate: now - 45 * 86400000,
              dueDate: now - 15 * 86400000,
              returnDate: null,
              location: '东城区社区站',
            },
            {
              recordId: 'record-2',
              bookId: 'book-sample-6',
              borrowerName: '李四',
              borrowDate: now - 10 * 86400000,
              dueDate: now + 20 * 86400000,
              returnDate: null,
              isDrifting: true,
              location: '西城区阅读角',
            },
            {
              recordId: 'record-3',
              bookId: 'book-sample-3',
              borrowerName: '王五',
              borrowDate: now - 20 * 86400000,
              dueDate: now + 10 * 86400000,
              returnDate: null,
              location: '朝阳区图书站',
            },
            {
              recordId: 'record-4',
              bookId: 'book-sample-6',
              borrowerName: '赵六',
              borrowDate: now - 60 * 86400000,
              dueDate: now - 30 * 86400000,
              returnDate: now - 40 * 86400000,
              isDrifting: true,
              location: '海淀区漂流点',
            },
            {
              recordId: 'record-5',
              bookId: 'book-sample-6',
              borrowerName: '钱七',
              borrowDate: now - 35 * 86400000,
              dueDate: now - 5 * 86400000,
              returnDate: now - 15 * 86400000,
              isDrifting: true,
              location: '丰台区交换站',
            },
          ];
        }
      },
    }
  )
);
