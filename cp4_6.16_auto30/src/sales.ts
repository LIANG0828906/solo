import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import type { ShiftType } from './shifts';
import { useWorkersStore } from './workers';

export interface SaleRecord {
  id: string;
  date: string;
  shift: ShiftType;
  totalAmount: number;
  orderCount: number;
  avgOrderValue: number;
  workerIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface SalesState {
  records: SaleRecord[];
  addRecord: (
    record: Omit<SaleRecord, 'id' | 'avgOrderValue' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateRecord: (
    id: string,
    updates: Partial<Omit<SaleRecord, 'id' | 'createdAt'>>
  ) => void;
  deleteRecord: (id: string) => void;
  getRecord: (date: string, shift: ShiftType) => SaleRecord | undefined;
  getRecordsByDateRange: (startDate: string, endDate: string) => SaleRecord[];
  getTodayTotal: () => number;
  getMonthOrderCount: () => number;
  getLast7DaysTrend: () => { date: string; amount: number }[];
  getMonthlyWorkerSales: () => { workerId: string; workerName: string; total: number }[];
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

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) => {
        const avgOrderValue =
          record.orderCount > 0
            ? Math.round((record.totalAmount / record.orderCount) * 100) / 100
            : 0;
        const now = new Date().toISOString();
        set((state) => ({
          records: [
            ...state.records,
            {
              ...record,
              id: uuidv4(),
              avgOrderValue,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
      },

      updateRecord: (id, updates) =>
        set((state) => ({
          records: state.records.map((r) => {
            if (r.id !== id) return r;
            const totalAmount = updates.totalAmount ?? r.totalAmount;
            const orderCount = updates.orderCount ?? r.orderCount;
            const avgOrderValue =
              orderCount > 0
                ? Math.round((totalAmount / orderCount) * 100) / 100
                : 0;
            return {
              ...r,
              ...updates,
              totalAmount,
              orderCount,
              avgOrderValue,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),

      getRecord: (date, shift) =>
        get().records.find((r) => r.date === date && r.shift === shift),

      getRecordsByDateRange: (startDate, endDate) => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return get()
          .records.filter((r) =>
            isWithinInterval(parseISO(r.date), { start, end })
          )
          .sort((a, b) => b.date.localeCompare(a.date));
      },

      getTodayTotal: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get()
          .records.filter((r) => r.date === today)
          .reduce((sum, r) => sum + r.totalAmount, 0);
      },

      getMonthOrderCount: () => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return get()
          .records.filter((r) =>
            isWithinInterval(parseISO(r.date), { start, end })
          )
          .reduce((sum, r) => sum + r.orderCount, 0);
      },

      getLast7DaysTrend: () => {
        const today = new Date();
        const result: { date: string; amount: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayTotal = get()
            .records.filter((r) => r.date === dateStr)
            .reduce((sum, r) => sum + r.totalAmount, 0);
          result.push({
            date: format(d, 'MM/dd'),
            amount: dayTotal,
          });
        }
        return result;
      },

      getMonthlyWorkerSales: () => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        const workerTotals: { [key: string]: number } = {};

        const monthRecords = get().records.filter((r) =>
          isWithinInterval(parseISO(r.date), { start, end })
        );

        monthRecords.forEach((record) => {
          const workerCount = record.workerIds.length;
          if (workerCount === 0) return;
          const perWorker = record.totalAmount / workerCount;
          record.workerIds.forEach((wid) => {
            workerTotals[wid] = (workerTotals[wid] || 0) + perWorker;
          });
        });

        const workers = useWorkersStore.getState().workers;

        return Object.entries(workerTotals)
          .map(([workerId, total]) => ({
            workerId,
            workerName:
              workers.find((w: any) => w.id === workerId)?.name || '未知员工',
            total: Math.round(total * 100) / 100,
          }))
          .sort((a, b) => b.total - a.total);
      },
    }),
    {
      name: 'fantasy-tavern-sales',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
