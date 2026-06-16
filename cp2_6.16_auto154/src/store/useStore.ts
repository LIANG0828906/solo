import { create } from 'zustand';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DataSource = 'cityA' | 'cityB';

interface WeatherState {
  temperatureLevel: number;
  humidityLevel: number;
  windLevel: number;
  currentTime: Date;
  simulationHour: number;
  isPlaying: boolean;
  dataSource: DataSource;
  temperatureUnit: TemperatureUnit;
  selectedGrid: { x: number; y: number } | null;
  showHelp: boolean;
  
  setTemperatureLevel: (level: number) => void;
  setHumidityLevel: (level: number) => void;
  setWindLevel: (level: number) => void;
  setCurrentTime: (time: Date) => void;
  setSimulationHour: (hour: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setDataSource: (source: DataSource) => void;
  toggleDataSource: () => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  toggleTemperatureUnit: () => void;
  setSelectedGrid: (grid: { x: number; y: number } | null) => void;
  setShowHelp: (show: boolean) => void;
  
  celsiusToFahrenheit: (c: number) => number;
  formatTemperature: (c: number) => string;
}

export const useStore = create<WeatherState>((set, get) => ({
  temperatureLevel: 20,
  humidityLevel: 60,
  windLevel: 5,
  currentTime: new Date(),
  simulationHour: new Date().getHours() + new Date().getMinutes() / 60,
  isPlaying: false,
  dataSource: 'cityA',
  temperatureUnit: 'celsius',
  selectedGrid: null,
  showHelp: false,
  
  setTemperatureLevel: (level) => set({ temperatureLevel: Math.max(-10, Math.min(40, level)) }),
  setHumidityLevel: (level) => set({ humidityLevel: Math.max(0, Math.min(100, level)) }),
  setWindLevel: (level) => set({ windLevel: Math.max(0, Math.min(12, level)) }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setSimulationHour: (hour) => set({ simulationHour: ((hour % 24) + 24) % 24 }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setDataSource: (source) => set({ dataSource: source }),
  toggleDataSource: () => set((state) => ({
    dataSource: state.dataSource === 'cityA' ? 'cityB' : 'cityA',
  })),
  setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
  toggleTemperatureUnit: () => set((state) => ({
    temperatureUnit: state.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius',
  })),
  setSelectedGrid: (grid) => set({ selectedGrid: grid }),
  setShowHelp: (show) => set({ showHelp: show }),
  
  celsiusToFahrenheit: (c) => c * 9 / 5 + 32,
  formatTemperature: (c) => {
    const { temperatureUnit } = get();
    if (temperatureUnit === 'fahrenheit') {
      return `${Math.round(c * 9 / 5 + 32)}°F`;
    }
    return `${Math.round(c)}°C`;
  },
}));
