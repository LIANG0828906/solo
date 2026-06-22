import { create } from 'zustand';

export enum WeatherType {
  SUNNY = 'sunny',
  RAINY = 'rainy',
  SNOWY = 'snowy',
  STORMY = 'stormy',
}

export interface WeatherConfig {
  backgroundColor: string;
  buttonThemeColor: string;
}

export const weatherConfigs: Record<WeatherType, WeatherConfig> = {
  [WeatherType.SUNNY]: {
    backgroundColor: '#87CEEB',
    buttonThemeColor: '#FFD700',
  },
  [WeatherType.RAINY]: {
    backgroundColor: '#4A4A4A',
    buttonThemeColor: '#4682B4',
  },
  [WeatherType.SNOWY]: {
    backgroundColor: '#D3D3D3',
    buttonThemeColor: '#FFFFFF',
  },
  [WeatherType.STORMY]: {
    backgroundColor: '#000000',
    buttonThemeColor: '#8B008B',
  },
};

interface WeatherState {
  currentWeather: WeatherType;
  lightningActive: boolean;
  setWeather: (weather: WeatherType) => void;
  setLightningActive: (active: boolean) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  currentWeather: WeatherType.SUNNY,
  lightningActive: false,
  setWeather: (weather) => set({ currentWeather: weather }),
  setLightningActive: (active) => set({ lightningActive: active }),
}));
