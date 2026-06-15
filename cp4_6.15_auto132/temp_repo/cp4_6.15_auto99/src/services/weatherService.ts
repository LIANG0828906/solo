import axios from 'axios';
import type { WeatherData } from '@/types/plant';

export interface WeatherResult {
  data: WeatherData;
  source: 'api' | 'fallback' | 'cache';
  error?: string;
}

const CACHE_DURATION = 20 * 60 * 1000;

let weatherCache: { city: string; data: WeatherData; timestamp: number } | null = null;

const weatherConditionMap: Record<string, WeatherData['condition']> = {
  'Clear': 'sunny',
  'Sunny': 'sunny',
  'Partly Cloudy': 'cloudy',
  'Cloudy': 'cloudy',
  'Overcast': 'cloudy',
  'Rain': 'rainy',
  'Light Rain': 'rainy',
  'Heavy Rain': 'rainy',
  'Thunderstorm': 'rainy',
  'Snow': 'snowy',
  'Light Snow': 'snowy',
  'Heavy Snow': 'snowy',
};

function getApiKey(): string | null {
  const key = import.meta.env.VITE_WEATHER_API_KEY;
  if (!key) return null;
  if (key === 'your_weatherapi_key_here' || key === 'undefined' || key === 'null') return null;
  return key;
}

function createFallbackWeather(city: string, now: number): WeatherData {
  return {
    city: city || '北京',
    temperature: 22,
    condition: 'sunny',
    precipitation: 0,
    humidity: 55,
    timestamp: now,
  };
}

export async function getWeather(city: string): Promise<WeatherResult> {
  const now = Date.now();
  
  if (weatherCache && weatherCache.city === city && now - weatherCache.timestamp < CACHE_DURATION) {
    return { data: weatherCache.data, source: 'cache' };
  }

  const apiKey = getApiKey();
  
  if (!apiKey) {
    const fallbackData = createFallbackWeather(city, now);
    weatherCache = { city, data: fallbackData, timestamp: now };
    return {
      data: fallbackData,
      source: 'fallback',
      error: '未配置天气API密钥，使用模拟天气数据。请在.env文件中设置VITE_WEATHER_API_KEY。',
    };
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`,
      { timeout: 8000 }
    );
    const data = response.data;
    const conditionText = data.current.condition.text;
    const condition = weatherConditionMap[conditionText] || 'cloudy';

    const weatherData: WeatherData = {
      city: data.location.name,
      temperature: data.current.temp_c,
      condition,
      precipitation: data.current.precip_mm,
      humidity: data.current.humidity,
      timestamp: now,
    };

    weatherCache = { city, data: weatherData, timestamp: now };
    return { data: weatherData, source: 'api' };
  } catch (error) {
    const fallbackData = createFallbackWeather(city, now);
    weatherCache = { city, data: fallbackData, timestamp: now };
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return {
      data: fallbackData,
      source: 'fallback',
      error: `获取天气数据失败(${errorMessage})，使用模拟数据。`,
    };
  }
}

export function getWateringCoefficient(weather: WeatherData): number {
  let coefficient = 1.0;

  switch (weather.condition) {
    case 'sunny':
      coefficient += 0.15;
      break;
    case 'cloudy':
      coefficient += 0.0;
      break;
    case 'rainy':
      coefficient -= 0.3;
      break;
    case 'snowy':
      coefficient -= 0.2;
      break;
  }

  if (weather.temperature > 30) {
    coefficient += 0.15;
  } else if (weather.temperature > 25) {
    coefficient += 0.08;
  } else if (weather.temperature < 10) {
    coefficient -= 0.15;
  }

  if (weather.humidity > 80) {
    coefficient -= 0.1;
  } else if (weather.humidity < 30) {
    coefficient += 0.08;
  }

  if (weather.precipitation > 10) {
    coefficient -= 0.3;
  } else if (weather.precipitation > 5) {
    coefficient -= 0.15;
  }

  return Math.max(0.4, Math.min(1.8, coefficient));
}

export function getWateringSuitability(weather: WeatherData): 'good' | 'moderate' | 'bad' {
  const coefficient = getWateringCoefficient(weather);
  
  if (coefficient >= 1.1) {
    return 'bad';
  } else if (coefficient >= 0.8) {
    return 'moderate';
  } else {
    return 'good';
  }
}

export function clearWeatherCache(): void {
  weatherCache = null;
}
