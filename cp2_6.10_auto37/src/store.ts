import { create } from 'zustand';
import {
  AppState,
  SignalTower,
  MilitaryReport,
  WeatherData,
  LogEntry,
  DecryptStep,
  UrgencyLevel,
} from './types';

const initialTowers: SignalTower[] = [
  { id: 'tower-1', name: '甲', position: { x: 20, y: 30 }, isBurning: false, smokeCount: 0, burningTime: 0 },
  { id: 'tower-2', name: '乙', position: { x: 40, y: 25 }, isBurning: false, smokeCount: 0, burningTime: 0 },
  { id: 'tower-3', name: '丙', position: { x: 50, y: 50 }, isBurning: false, smokeCount: 0, burningTime: 0 },
  { id: 'tower-4', name: '丁', position: { x: 70, y: 35 }, isBurning: false, smokeCount: 0, burningTime: 0 },
  { id: 'tower-5', name: '戊', position: { x: 80, y: 65 }, isBurning: false, smokeCount: 0, burningTime: 0 },
];

const initialWeather: WeatherData = {
  windDirection: 'N',
  windSpeed: 2,
};

export const useAppStore = create<AppState & {
  setCurrentReport: (report: MilitaryReport | null) => void;
  setDecryptStep: (step: DecryptStep) => void;
  setDecryptProgress: (progress: number) => void;
  setFanqieResult: (result: string) => void;
  setWuxingResult: (result: string) => void;
  setWeather: (weather: WeatherData) => void;
  setMapZoom: (zoom: number) => void;
  setMapOffset: (offset: { x: number; y: number }) => void;
  setSelectedTower: (towerId: string | null) => void;
  lightTower: (towerId: string, smokeCount: number) => void;
  extinguishTower: (towerId: string) => void;
  addScore: (points: number) => void;
  deductScore: (points: number) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setShowCourierEffect: (show: boolean) => void;
  addReport: (report: MilitaryReport) => void;
  updateReport: (id: string, updates: Partial<MilitaryReport>) => void;
  resetDecrypt: () => void;
}>((set) => ({
  reports: [],
  currentReport: null,
  towers: initialTowers,
  decryptStep: 'idle',
  decryptProgress: 0,
  mapZoom: 1,
  mapOffset: { x: 0, y: 0 },
  score: 0,
  weather: initialWeather,
  logs: [],
  selectedTower: null,
  showCourierEffect: false,
  fanqieResult: '',
  wuxingResult: '',

  setCurrentReport: (report) => set({ currentReport: report }),
  setDecryptStep: (step) => set({ decryptStep: step }),
  setDecryptProgress: (progress) => set({ decryptProgress: progress }),
  setFanqieResult: (result) => set({ fanqieResult: result }),
  setWuxingResult: (result) => set({ wuxingResult: result }),
  setWeather: (weather) => set({ weather }),
  setMapZoom: (zoom) => set({ mapZoom: Math.max(0.5, Math.min(2, zoom)) }),
  setMapOffset: (offset) => set({ mapOffset: offset }),
  setSelectedTower: (towerId) => set({ selectedTower: towerId }),

  lightTower: (towerId, smokeCount) =>
    set((state) => ({
      towers: state.towers.map((tower) =>
        tower.id === towerId
          ? { ...tower, isBurning: true, smokeCount, burningTime: Date.now() }
          : tower
      ),
    })),

  extinguishTower: (towerId) =>
    set((state) => ({
      towers: state.towers.map((tower) =>
        tower.id === towerId
          ? { ...tower, isBurning: false, smokeCount: 0, burningTime: 0 }
          : tower
      ),
    })),

  addScore: (points) => set((state) => {
    const newScore = state.score + points;
    return {
      score: newScore,
      showCourierEffect: newScore >= 50 && state.score < 50,
    };
  }),

  deductScore: (points) => set((state) => ({
    score: Math.max(0, state.score - points),
  })),

  addLog: (log) => set((state) => ({
    logs: [log, ...state.logs].slice(0, 50),
  })),

  clearLogs: () => set({ logs: [] }),

  setShowCourierEffect: (show) => set({ showCourierEffect: show }),

  addReport: (report) => set((state) => ({
    reports: [...state.reports, report],
  })),

  updateReport: (id, updates) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
      currentReport:
        state.currentReport?.id === id
          ? { ...state.currentReport, ...updates }
          : state.currentReport,
    })),

  resetDecrypt: () =>
    set({
      decryptStep: 'idle',
      decryptProgress: 0,
      fanqieResult: '',
      wuxingResult: '',
    }),
}));
