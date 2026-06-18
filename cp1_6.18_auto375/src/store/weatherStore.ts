import { create } from 'zustand';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  city: string;
  timestamp: number;
}

export interface ParticleState {
  particleCount: number;
  connectionThreshold: number;
  fps: number;
  isResponsive: boolean;
  lowFpsStartTime: number | null;
}

interface WeatherStore {
  weather: WeatherData;
  particleState: ParticleState;
  cities: string[];
  currentCity: string;
  setCity: (city: string) => void;
  updateWeather: (data: Partial<WeatherData>) => void;
  toggleResponsive: () => void;
  setFps: (fps: number) => void;
  resetPerformance: () => void;
}

const CITY_BASELINES: Record<string, Omit<WeatherData, 'city' | 'timestamp'>> = {
  北京: { temperature: 15, humidity: 50, windSpeed: 5, windDirection: 90, pressure: 1013 },
  上海: { temperature: 20, humidity: 65, windSpeed: 4, windDirection: 135, pressure: 1015 },
  东京: { temperature: 18, humidity: 60, windSpeed: 6, windDirection: 45, pressure: 1012 },
  纽约: { temperature: 12, humidity: 55, windSpeed: 7, windDirection: 270, pressure: 1010 },
};

const createInitialWeather = (city: string): WeatherData => {
  const baseline = CITY_BASELINES[city];
  return {
    ...baseline,
    city,
    timestamp: Date.now(),
  };
};

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  weather: createInitialWeather('北京'),
  particleState: {
    particleCount: 800,
    connectionThreshold: 0.8,
    fps: 60,
    isResponsive: true,
    lowFpsStartTime: null,
  },
  cities: ['北京', '上海', '东京', '纽约'],
  currentCity: '北京',

  setCity: (city: string) => {
    set({
      currentCity: city,
      weather: createInitialWeather(city),
    });
  },

  updateWeather: (data: Partial<WeatherData>) => {
    set((state) => ({
      weather: { ...state.weather, ...data },
    }));
  },

  toggleResponsive: () => {
    set((state) => ({
      particleState: {
        ...state.particleState,
        isResponsive: !state.particleState.isResponsive,
      },
    }));
  },

  setFps: (fps: number) => {
    const { particleState } = get();
    const now = Date.now();

    if (fps < 40) {
      if (particleState.lowFpsStartTime === null) {
        set((state) => ({
          particleState: {
            ...state.particleState,
            fps,
            lowFpsStartTime: now,
          },
        }));
      } else if (now - particleState.lowFpsStartTime >= 2000) {
        set((state) => ({
          particleState: {
            ...state.particleState,
            fps,
            particleCount: 400,
            connectionThreshold: 0.5,
          },
        }));
      } else {
        set((state) => ({
          particleState: {
            ...state.particleState,
            fps,
          },
        }));
      }
    } else {
      set((state) => ({
        particleState: {
          ...state.particleState,
          fps,
          lowFpsStartTime: null,
        },
      }));
    }
  },

  resetPerformance: () => {
    set((state) => ({
      particleState: {
        ...state.particleState,
        particleCount: 800,
        connectionThreshold: 0.8,
        lowFpsStartTime: null,
      },
    }));
  },
}));
