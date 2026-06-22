import type { WeatherData } from './types';

export function getWeather(): WeatherData {
  const baseTemp = 18 + Math.random() * 15;
  return {
    temperature: Math.round(baseTemp * 10) / 10,
    forecast: [
      { day: 1, rainProbability: Math.floor(Math.random() * 100) },
      { day: 2, rainProbability: Math.floor(Math.random() * 100) },
      { day: 3, rainProbability: Math.floor(Math.random() * 100) }
    ]
  };
}

export function willRainSoon(weather: WeatherData): boolean {
  return weather.forecast.some(f => f.rainProbability > 60);
}
