import { create } from 'zustand';

export enum Weather {
  Sunny = 'sunny',
  Rainy = 'rainy',
  Snowy = 'snowy',
  Stormy = 'stormy'
}

export const WEATHER_COLORS: Record<Weather, string> = {
  [Weather.Sunny]: '#87CEEB',
  [Weather.Rainy]: '#4A4A4A',
  [Weather.Snowy]: '#D3D3D3',
  [Weather.Stormy]: '#000000'
};

export const WEATHER_BUTTON_COLORS: Record<Weather, string> = {
  [Weather.Sunny]: '#FFD700',
  [Weather.Rainy]: '#4682B4',
  [Weather.Snowy]: '#FFFFFF',
  [Weather.Stormy]: '#8B008B'
};

export const WEATHER_LABELS: Record<Weather, string> = {
  [Weather.Sunny]: '晴天',
  [Weather.Rainy]: '雨天',
  [Weather.Snowy]: '雪天',
  [Weather.Stormy]: '风暴'
};

interface WeatherState {
  weather: Weather;
  setWeather: (weather: Weather) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: Weather.Sunny,
  setWeather: (weather) => set({ weather })
}));
