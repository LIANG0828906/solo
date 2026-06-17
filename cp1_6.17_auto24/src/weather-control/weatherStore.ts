import { create } from 'zustand';

export enum WeatherType {
  SUNNY = 'sunny',
  RAINY = 'rainy',
  SNOWY = 'snowy',
  STORMY = 'stormy'
}

export const weatherColors: Record<WeatherType, string> = {
  [WeatherType.SUNNY]: '#87CEEB',
  [WeatherType.RAINY]: '#4A4A4A',
  [WeatherType.SNOWY]: '#D3D3D3',
  [WeatherType.STORMY]: '#000000'
};

export const weatherLabels: Record<WeatherType, string> = {
  [WeatherType.SUNNY]: '晴天',
  [WeatherType.RAINY]: '雨天',
  [WeatherType.SNOWY]: '雪天',
  [WeatherType.STORMY]: '风暴'
};

export const weatherButtonColors: Record<WeatherType, string> = {
  [WeatherType.SUNNY]: '#FFD700',
  [WeatherType.RAINY]: '#4682B4',
  [WeatherType.SNOWY]: '#FFFFFF',
  [WeatherType.STORMY]: '#8B008B'
};

interface WeatherState {
  currentWeather: WeatherType;
  setWeather: (weather: WeatherType) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  currentWeather: WeatherType.SUNNY,
  setWeather: (weather: WeatherType) => set({ currentWeather: weather })
}));
