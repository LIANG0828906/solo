import { create } from 'zustand';
import { WeatherType } from './weatherTypes';

interface WeatherState {
  weather: WeatherType;
  setWeather: (w: WeatherType) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: WeatherType.Sunny,
  setWeather: (weather) => set({ weather }),
}));
