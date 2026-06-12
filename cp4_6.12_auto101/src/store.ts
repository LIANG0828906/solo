import { create } from 'zustand';
import type { ChartItem, ChartType, ThemeMode, DataRange, HistoryState } from './types';

const MAX_HISTORY = 5;

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateRandomData = (type: ChartType): { title: string; data: { name: string; value: number }[] } => {
  if (type === 'bar') {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return {
      title: '月份销售额',
      data: months.map((name) => ({
        name,
        value: Math.floor(Math.random() * 10000) + 1000,
      })),
    };
  }
  if (type === 'line') {
    const days = Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
    return {
      title: '用户增长量',
      data: days.map((name) => ({
        name,
        value: Math.floor(Math.random() * 500) + 50,
      })),
    };
  }
  const products = ['产品A', '产品B', '产品C', '产品D', '产品E'];
  return {
    title: '产品占比',
    data: products.map((name) => ({
      name,
      value: Math.floor(Math.random() * 100) + 10,
    })),
  };
};

interface DashboardStore {
  charts: ChartItem[];
  globalTheme: ThemeMode;
  selectedChartId: string | null;
  history: HistoryState[];
  showAddModal: boolean;
  showSettingsPanel: boolean;

  addChart: (type: ChartType) => void;
  removeChart: (id: string) => void;
  moveChart: (fromIndex: number, toIndex: number) => void;
  updateChart: (id: string, config: Partial<Pick<ChartItem, 'title' | 'theme' | 'dataRange'>>) => void;
  undo: () => void;
  setGlobalTheme: (theme: ThemeMode) => void;
  selectChart: (id: string | null) => void;
  setShowAddModal: (show: boolean) => void;
  setShowSettingsPanel: (show: boolean) => void;
  exportConfig: () => string;
  importConfig: (config: string) => void;
}

const pushHistory = (state: { charts: ChartItem[]; history: HistoryState[] }) => {
  const snapshot: HistoryState = { charts: JSON.parse(JSON.stringify(state.charts)) };
  const newHistory = [...state.history, snapshot];
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  return newHistory;
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  charts: [],
  globalTheme: 'light',
  selectedChartId: null,
  history: [],
  showAddModal: false,
  showSettingsPanel: false,

  addChart: (type: ChartType) => {
    const { title, data } = generateRandomData(type);
    set((state) => {
      const newChart: ChartItem = {
        id: generateId(),
        type,
        title,
        theme: state.globalTheme,
        dataRange: 'all',
        data,
        position: state.charts.length,
      };
      return {
        charts: [...state.charts, newChart],
        history: pushHistory(state),
        showAddModal: false,
      };
    });
  },

  removeChart: (id: string) => {
    set((state) => ({
      charts: state.charts
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, position: idx })),
      history: pushHistory(state),
      selectedChartId: state.selectedChartId === id ? null : state.selectedChartId,
      showSettingsPanel: state.selectedChartId === id ? false : state.showSettingsPanel,
    }));
  },

  moveChart: (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    set((state) => {
      const newCharts = [...state.charts];
      const [removed] = newCharts.splice(fromIndex, 1);
      newCharts.splice(toIndex, 0, removed);
      const repositioned = newCharts.map((c, idx) => ({ ...c, position: idx }));
      return {
        charts: repositioned,
        history: pushHistory(state),
      };
    });
  },

  updateChart: (id: string, config: Partial<Pick<ChartItem, 'title' | 'theme' | 'dataRange'>>) => {
    set((state) => ({
      charts: state.charts.map((c) => (c.id === id ? { ...c, ...config } : c)),
      history: pushHistory(state),
    }));
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const newHistory = [...state.history];
      const previous = newHistory.pop()!;
      return {
        charts: previous.charts,
        history: newHistory,
      };
    });
  },

  setGlobalTheme: (theme: ThemeMode) => {
    set({ globalTheme: theme });
  },

  selectChart: (id: string | null) => {
    set({ selectedChartId: id, showSettingsPanel: id !== null });
  },

  setShowAddModal: (show: boolean) => {
    set({ showAddModal: show });
  },

  setShowSettingsPanel: (show: boolean) => {
    if (!show) {
      set({ showSettingsPanel: false, selectedChartId: null });
    } else {
      set({ showSettingsPanel: true });
    }
  },

  exportConfig: () => {
    const state = get();
    const config = {
      charts: state.charts,
      globalTheme: state.globalTheme,
    };
    return JSON.stringify(config, null, 2);
  },

  importConfig: (configStr: string) => {
    try {
      const config = JSON.parse(configStr);
      if (config.charts && Array.isArray(config.charts)) {
        set({
          charts: config.charts,
          globalTheme: config.globalTheme || 'light',
          history: [],
        });
      }
    } catch (e) {
      console.error('导入配置失败:', e);
    }
  },
}));
