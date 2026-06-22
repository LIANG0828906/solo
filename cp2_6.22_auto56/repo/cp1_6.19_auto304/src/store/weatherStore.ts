import { create } from 'zustand'

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy'

interface WeatherState {
  currentWeather: WeatherType
  particleDensity: number
  windSpeed: number
  setWeather: (weather: WeatherType) => void
  setDensity: (density: number) => void
  setWindSpeed: (speed: number) => void
}

export const weatherColors: Record<WeatherType, string> = {
  sunny: '#FFD700',
  cloudy: '#A9A9A9',
  rainy: '#4A90D9',
  snowy: '#FFFFFF',
}

export const weatherLabels: Record<WeatherType, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '雨天',
  snowy: '雪天',
}

export const useWeatherStore = create<WeatherState>((set) => ({
  currentWeather: 'sunny',
  particleDensity: 2000,
  windSpeed: 2,
  setWeather: (weather) => set({ currentWeather: weather }),
  setDensity: (density) => set({ particleDensity: Math.round(density) }),
  setWindSpeed: (speed) => set({ windSpeed: speed }),
}))
