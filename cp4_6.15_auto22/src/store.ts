import { create } from 'zustand';
import type { LogEntry, FilterState, ToastMessage, CoffeeBean, BrewMethod } from '@/types';
import { DEFAULT_FILTER } from '@/types';

interface CoffeeStore {
  logs: LogEntry[];
  customBeans: CoffeeBean[];
  filter: FilterState;
  toasts: ToastMessage[];
  expandedId: string | null;
  formCollapsed: boolean;

  addLog: (entry: LogEntry) => void;
  addCustomBean: (bean: CoffeeBean) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleExpand: (id: string) => void;
  toggleFormCollapsed: () => void;
  getFilteredLogs: () => LogEntry[];
}

const STORAGE_KEY = 'coffee-brew-logs';
const BEANS_KEY = 'coffee-custom-beans';

function loadLogs(): LogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: LogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch { /* ignore quota errors */ }
}

function loadCustomBeans(): CoffeeBean[] {
  try {
    const data = localStorage.getItem(BEANS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCustomBeans(beans: CoffeeBean[]) {
  try {
    localStorage.setItem(BEANS_KEY, JSON.stringify(beans));
  } catch { /* ignore */ }
}

function filterLogs(logs: LogEntry[], filter: FilterState): LogEntry[] {
  const now = Date.now();
  const DAY = 86400000;
  return logs.filter((log) => {
    if (filter.beanId && log.bean.id !== filter.beanId) return false;
    if (filter.brewMethod && log.brewMethod !== filter.brewMethod) return false;
    if (filter.minRating !== null && log.rating < filter.minRating) return false;
    if (filter.timeRange === '7d' && now - log.createdAt > 7 * DAY) return false;
    if (filter.timeRange === '30d' && now - log.createdAt > 30 * DAY) return false;
    return true;
  });
}

function sortLogs(logs: LogEntry[], filter: FilterState): LogEntry[] {
  const sorted = [...logs];
  const dir = filter.sortOrder === 'asc' ? 1 : -1;
  if (filter.sortBy === 'date') {
    sorted.sort((a, b) => (a.createdAt - b.createdAt) * dir);
  } else {
    sorted.sort((a, b) => (a.rating - b.rating) * dir);
  }
  return sorted;
}

export const useCoffeeStore = create<CoffeeStore>((set, get) => ({
  logs: loadLogs(),
  customBeans: loadCustomBeans(),
  filter: { ...DEFAULT_FILTER },
  toasts: [],
  expandedId: null,
  formCollapsed: false,

  addLog: (entry) => {
    const logs = [entry, ...get().logs];
    saveLogs(logs);
    set({ logs });
  },

  addCustomBean: (bean) => {
    const beans = [...get().customBeans, bean];
    saveCustomBeans(beans);
    set({ customBeans: beans });
  },

  setFilter: (partial) => {
    set({ filter: { ...get().filter, ...partial } });
  },

  resetFilter: () => {
    set({ filter: { ...DEFAULT_FILTER } });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast = { ...toast, id };
    set({ toasts: [...get().toasts, newToast] });
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  toggleExpand: (id) => {
    set({ expandedId: get().expandedId === id ? null : id });
  },

  toggleFormCollapsed: () => {
    set({ formCollapsed: !get().formCollapsed });
  },

  getFilteredLogs: () => {
    const { logs, filter } = get();
    const filtered = filterLogs(logs, filter);
    return sortLogs(filtered, filter);
  },
}));
