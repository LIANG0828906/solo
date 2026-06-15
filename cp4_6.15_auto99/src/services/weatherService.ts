import axios from 'axios';
import type { WeatherData } from '@/types/plant';

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
  return import.meta.env.VITE_WEATHER_API_KEY || null;
}

let hasShownKeyWarning = false;

function showKeyWarning(): void {
  if (hasShownKeyWarning) return;
  hasShownKeyWarning = true;
  console.warn(
    '%c🌤️ 天气API提示',
    'font-size: 14px; font-weight: bold; color: #f4a261;',
    '\n未检测到天气API密钥，当前使用模拟天气数据。\n' +
    '如需获取真实天气，请：\n' +
    '1. 在 https://www.weatherapi.com 注册获取免费API Key\n' +
    '2. 在项目根目录创建 .env 文件，添加：VITE_WEATHER_API_KEY=你的API密钥\n' +
    '3. 重启开发服务器'
  );
}

export async function getWeather(city: string): Promise<WeatherData> {
  const now = Date.now();
  
  if (weatherCache && weatherCache.city === city && now - weatherCache.timestamp < CACHE_DURATION) {
    return weatherCache.data;
  }

  const apiKey = getApiKey();
  
  if (!apiKey) {
    showKeyWarning();
    const mockWeather: WeatherData = {
      city: city || '北京',
      temperature: 22,
      condition: 'sunny',
      precipitation: 0,
      humidity: 55,
      timestamp: now,
    };
    weatherCache = { city, data: mockWeather, timestamp: now };
    return mockWeather;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`
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
    return weatherData;
  } catch (error) {
    console.error('获取天气数据失败，使用模拟数据:', error);
    const mockWeather: WeatherData = {
      city: city || '北京',
      temperature: 22,
      condition: 'sunny',
      precipitation: 0,
      humidity: 55,
      timestamp: now,
    };
    weatherCache = { city, data: mockWeather, timestamp: now };
    return mockWeather;
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
