import { create } from 'zustand';
import type { CityWeather, WeatherType } from '../data/weatherService';
import type { NarrativeResult } from '../engine/narrativeEngine';
import type { VisualConfig } from '../renderer/storyRenderer';

interface AppState {
  city: string;
  timeRange: number;
  isLoading: boolean;
  weatherData: CityWeather | null;
  narrative: NarrativeResult | null;
  visualConfig: VisualConfig | null;
  dominantWeather: WeatherType | null;
  
  setCity: (city: string) => void;
  setTimeRange: (days: number) => void;
  setIsLoading: (loading: boolean) => void;
  setWeatherData: (data: CityWeather | null) => void;
  setNarrative: (narrative: NarrativeResult | null) => void;
  setVisualConfig: (config: VisualConfig | null) => void;
  setDominantWeather: (weather: WeatherType | null) => void;
  
  resetNarrative: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  city: '雷克雅未克',
  timeRange: 7,
  isLoading: false,
  weatherData: null,
  narrative: null,
  visualConfig: null,
  dominantWeather: null,
  
  setCity: (city) => set({ city, narrative: null }),
  setTimeRange: (days) => set({ timeRange: days, narrative: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setWeatherData: (data) => set({ weatherData: data }),
  setNarrative: (narrative) => set({ narrative }),
  setVisualConfig: (config) => set({ visualConfig: config }),
  setDominantWeather: (weather) => set({ dominantWeather: weather }),
  
  resetNarrative: () => set({ narrative: null })
}));
