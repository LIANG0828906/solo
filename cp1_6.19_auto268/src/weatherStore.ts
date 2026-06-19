import { create } from 'zustand';
import axios from 'axios';
import type { WeatherStore, City, WeatherData } from './types';

const mockWeatherData: Record<string, WeatherData> = {
  beijing: {
    cityId: 'beijing',
    temperature: 28,
    humidity: 45,
    windSpeed: 3.2,
    weatherType: 'sunny',
    feelsLike: 31,
  },
  shanghai: {
    cityId: 'shanghai',
    temperature: 25,
    humidity: 78,
    windSpeed: 2.8,
    weatherType: 'rainy',
    feelsLike: 27,
  },
  guangzhou: {
    cityId: 'guangzhou',
    temperature: 32,
    humidity: 85,
    windSpeed: 1.5,
    weatherType: 'foggy',
    feelsLike: 35,
  },
  chengdu: {
    cityId: 'chengdu',
    temperature: 18,
    humidity: 70,
    windSpeed: 2.1,
    weatherType: 'rainy',
    feelsLike: 16,
  },
  harbin: {
    cityId: 'harbin',
    temperature: -5,
    humidity: 65,
    windSpeed: 5.5,
    weatherType: 'snowy',
    feelsLike: -10,
  },
};

const cities: City[] = [
  { id: 'beijing', name: 'Beijing', nameZh: '北京' },
  { id: 'shanghai', name: 'Shanghai', nameZh: '上海' },
  { id: 'guangzhou', name: 'Guangzhou', nameZh: '广州' },
  { id: 'chengdu', name: 'Chengdu', nameZh: '成都' },
  { id: 'harbin', name: 'Harbin', nameZh: '哈尔滨' },
];

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  currentCityId: 'beijing',
  cities,
  weatherData: mockWeatherData,
  isLoading: false,
  isTransitioning: false,

  setCurrentCity: (cityId: string) => {
    set({ isTransitioning: true });
    setTimeout(() => {
      set({ currentCityId: cityId, isTransitioning: false });
    }, 500);
  },

  fetchWeather: async (cityId: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.get<WeatherData>(`/api/weather/${cityId}`, {
        adapter: (config) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              const data = mockWeatherData[cityId];
              resolve({
                data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
              });
            }, 300);
          });
        },
      });
      if (response.data) {
        set(state => ({
          weatherData: { ...state.weatherData, [cityId]: response.data },
        }));
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentWeather: () => {
    const state = get();
    return state.weatherData[state.currentCityId] || null;
  },

  getCurrentCity: () => {
    const state = get();
    return state.cities.find(c => c.id === state.currentCityId) || null;
  },
}));
