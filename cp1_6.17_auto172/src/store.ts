import { create } from 'zustand';
import { User, ChartData, ChartSummary, BirthInfo, PlanetData } from './types';

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  birthInfo: BirthInfo;
  setBirthInfo: (info: Partial<BirthInfo>) => void;
  
  chartData: ChartData | null;
  setChartData: (data: ChartData | null) => void;
  
  selectedPlanet: PlanetData | null;
  setSelectedPlanet: (planet: PlanetData | null) => void;
  
  annotations: Record<string, string>;
  setAnnotation: (planetName: string, content: string) => void;
  
  favorites: string[];
  addFavorite: (chartId: string) => void;
  removeFavorite: (chartId: string) => void;
  toggleFavorite: (chartId: string) => void;
  
  communityCharts: ChartSummary[];
  setCommunityCharts: (charts: ChartSummary[]) => void;
  
  toast: { message: string; visible: boolean } | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

const defaultBirthInfo: BirthInfo = {
  date: new Date().toISOString().split('T')[0],
  time: '12:00',
  city: '北京',
  timezone: 'Asia/Shanghai',
  latitude: 39.9042,
  longitude: 116.4074,
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'local-user-1',
    nickname: '占星爱好者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astrolover',
    createdAt: new Date().toISOString(),
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  
  birthInfo: defaultBirthInfo,
  setBirthInfo: (info) => set((state) => ({
    birthInfo: { ...state.birthInfo, ...info },
  })),
  
  chartData: null,
  setChartData: (data) => set({ chartData: data }),
  
  selectedPlanet: null,
  setSelectedPlanet: (planet) => set({ selectedPlanet: planet }),
  
  annotations: {},
  setAnnotation: (planetName, content) => set((state) => ({
    annotations: { ...state.annotations, [planetName]: content },
  })),
  
  favorites: [],
  addFavorite: (chartId) => set((state) => ({
    favorites: [...state.favorites, chartId],
  })),
  removeFavorite: (chartId) => set((state) => ({
    favorites: state.favorites.filter((id) => id !== chartId),
  })),
  toggleFavorite: (chartId) => {
    const { favorites } = get();
    if (favorites.includes(chartId)) {
      get().removeFavorite(chartId);
    } else {
      get().addFavorite(chartId);
    }
  },
  
  communityCharts: [],
  setCommunityCharts: (charts) => set({ communityCharts: charts }),
  
  toast: null,
  showToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => {
      set({ toast: null });
    }, 3000);
  },
  hideToast: () => set({ toast: null }),
}));

export default useAppStore;
