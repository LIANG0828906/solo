import { create } from 'zustand';
import type {
  User,
  Task,
  Coffee,
  ExchangeRecord,
  RankData,
  TimeRange,
  CompleteTaskResponse,
  ExchangeResponse,
  ExchangeRecordsResponse,
} from '@/types';
import { api } from '@/utils/api';

interface AppState {
  user: User | null;
  tasks: Task[];
  coffees: Coffee[];
  rankData: RankData | null;
  exchangeRecords: ExchangeRecord[];
  exchangeRecordsTotal: number;
  loading: Record<string, boolean>;
  pointsAnimation: { show: boolean; value: number };
  exchangeSuccess: { show: boolean; coffeeName: string; points: number } | null;
  errorMessage: string | null;
  currentPage: number;
  timeRange: TimeRange;
}

interface AppActions {
  fetchUser: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchCoffees: () => Promise<void>;
  fetchRank: (timeRange?: TimeRange) => Promise<void>;
  fetchExchangeRecords: (page?: number, pageSize?: number) => Promise<void>;
  completeTask: (taskId: string) => Promise<CompleteTaskResponse>;
  exchangeCoffee: (coffeeId: string) => Promise<ExchangeResponse>;
  setTimeRange: (timeRange: TimeRange) => void;
  setCurrentPage: (page: number) => void;
  clearExchangeSuccess: () => void;
  clearErrorMessage: () => void;
  clearPointsAnimation: () => void;
}

export const useStore = create<AppState & AppActions>((set, get) => ({
  user: null,
  tasks: [],
  coffees: [],
  rankData: null,
  exchangeRecords: [],
  exchangeRecordsTotal: 0,
  loading: {},
  pointsAnimation: { show: false, value: 0 },
  exchangeSuccess: null,
  errorMessage: null,
  currentPage: 1,
  timeRange: 'all',

  fetchUser: async () => {
    set({ loading: { ...get().loading, user: true } });
    try {
      const user = await api.getUser();
      set({ user });
    } finally {
      set({ loading: { ...get().loading, user: false } });
    }
  },

  fetchTasks: async () => {
    set({ loading: { ...get().loading, tasks: true } });
    try {
      const tasks = await api.getTasks();
      set({ tasks });
    } finally {
      set({ loading: { ...get().loading, tasks: false } });
    }
  },

  fetchCoffees: async () => {
    set({ loading: { ...get().loading, coffees: true } });
    try {
      const coffees = await api.getCoffees();
      set({ coffees });
    } finally {
      set({ loading: { ...get().loading, coffees: false } });
    }
  },

  fetchRank: async (timeRange = get().timeRange) => {
    set({ loading: { ...get().loading, rank: true } });
    try {
      const rankData = await api.getRank(timeRange);
      set({ rankData, timeRange });
    } finally {
      set({ loading: { ...get().loading, rank: false } });
    }
  },

  fetchExchangeRecords: async (page = get().currentPage, pageSize = 10) => {
    set({ loading: { ...get().loading, records: true } });
    try {
      const response: ExchangeRecordsResponse = await api.getExchangeRecords(page, pageSize);
      set({
        exchangeRecords: response.list,
        exchangeRecordsTotal: response.total,
        currentPage: page,
      });
    } finally {
      set({ loading: { ...get().loading, records: false } });
    }
  },

  completeTask: async (taskId: string) => {
    set({ loading: { ...get().loading, completeTask: true } });
    try {
      const result = await api.completeTask(taskId);
      if (result.success && get().user) {
        const oldPoints = get().user!.points;
        const newPoints = result.points;
        const gainedPoints = newPoints - oldPoints;
        set({
          user: {
            ...get().user!,
            points: newPoints,
            completedTasks: [...get().user!.completedTasks, taskId],
          },
          pointsAnimation: { show: true, value: gainedPoints },
        });
      } else if (!result.success) {
        set({ errorMessage: result.message });
      }
      return result;
    } finally {
      set({ loading: { ...get().loading, completeTask: false } });
    }
  },

  exchangeCoffee: async (coffeeId: string) => {
    set({ loading: { ...get().loading, exchange: true } });
    try {
      const result = await api.exchange(coffeeId);
      if (result.success && get().user && result.record) {
        const coffee = get().coffees.find(c => c.id === coffeeId);
        set({
          user: {
            ...get().user!,
            points: get().user!.points - result.record.pointsSpent,
          },
          coffees: get().coffees.map(c =>
            c.id === coffeeId ? { ...c, stock: result.remainingStock ?? c.stock - 1 } : c
          ),
          exchangeSuccess: {
            show: true,
            coffeeName: coffee?.name || result.record.coffeeName,
            points: result.record.pointsSpent,
          },
        });
      } else if (!result.success) {
        set({ errorMessage: result.message });
      }
      return result;
    } finally {
      set({ loading: { ...get().loading, exchange: false } });
    }
  },

  setTimeRange: (timeRange: TimeRange) => {
    set({ timeRange });
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  },

  clearExchangeSuccess: () => {
    set({ exchangeSuccess: null });
  },

  clearErrorMessage: () => {
    set({ errorMessage: null });
  },

  clearPointsAnimation: () => {
    set({ pointsAnimation: { show: false, value: 0 } });
  },
}));
