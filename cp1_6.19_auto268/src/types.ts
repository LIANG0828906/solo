export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'foggy';

export interface City {
  id: string;
  name: string;
  nameZh: string;
}

export interface WeatherData {
  cityId: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherType: WeatherType;
  feelsLike: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  angle?: number;
  swayPhase?: number;
  swayAmplitude?: number;
  rotation?: number;
  pulsePhase?: number;
}

export interface ParticleConfig {
  count: number;
  weatherType: WeatherType;
}

export interface WeatherStore {
  currentCityId: string;
  cities: City[];
  weatherData: Record<string, WeatherData>;
  isLoading: boolean;
  isTransitioning: boolean;
  setCurrentCity: (cityId: string) => void;
  fetchWeather: (cityId: string) => Promise<void>;
  getCurrentWeather: () => WeatherData | null;
  getCurrentCity: () => City | null;
}
