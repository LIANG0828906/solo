import { create } from 'zustand';
import { City, CurrentAirData, HistoryData, airApi, PollutantKey } from '@/api/airApi';

interface AirState {
  cities: City[];
  currentData: Record<string, CurrentAirData>;
  historyData: Record<string, HistoryData>;
  selectedCities: string[];
  compareVisible: boolean;
  activePollutant: PollutantKey;
  loading: boolean;
  error: string | null;

  fetchCities: () => Promise<void>;
  fetchAllCurrent: () => Promise<void>;
  fetchHistory: (cityId: string) => Promise<void>;
  toggleCitySelection: (cityId: string) => void;
  clearSelection: () => void;
  setCompareVisible: (visible: boolean) => void;
  setActivePollutant: (key: PollutantKey) => void;
  startAutoRefresh: () => () => void;
}

export const useAirStore = create<AirState>((set, get) => ({
  cities: [],
  currentData: {},
  historyData: {},
  selectedCities: [],
  compareVisible: false,
  activePollutant: 'pm25',
  loading: false,
  error: null,

  fetchCities: async () => {
    try {
      const cities = await airApi.getCities();
      set({ cities });
    } catch (e) {
      set({ error: '加载城市列表失败' });
    }
  },

  fetchAllCurrent: async () => {
    try {
      set({ loading: true });
      const data = await airApi.getAllCurrent();
      const currentData: Record<string, CurrentAirData> = {};
      data.forEach((item) => {
        currentData[item.cityId] = item;
      });
      set({ currentData, loading: false, error: null });
    } catch (e) {
      set({ loading: false, error: '加载实时数据失败' });
    }
  },

  fetchHistory: async (cityId: string) => {
    if (get().historyData[cityId]) return;
    try {
      const data = await airApi.getHistory(cityId);
      set((state) => ({
        historyData: { ...state.historyData, [cityId]: data },
      }));
    } catch (e) {
      set({ error: `加载 ${cityId} 历史数据失败` });
    }
  },

  toggleCitySelection: (cityId: string) => {
    set((state) => {
      const selected = state.selectedCities.includes(cityId)
        ? state.selectedCities.filter((id) => id !== cityId)
        : state.selectedCities.length >= 2
          ? [...state.selectedCities.slice(1), cityId]
          : [...state.selectedCities, cityId];
      return { selectedCities: selected };
    });
  },

  clearSelection: () => set({ selectedCities: [] }),

  setCompareVisible: (visible: boolean) => set({ compareVisible: visible }),

  setActivePollutant: (key: PollutantKey) => set({ activePollutant: key }),

  startAutoRefresh: () => {
    const interval = setInterval(() => {
      get().fetchAllCurrent();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  },
}));
