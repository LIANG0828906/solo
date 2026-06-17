import { v4 as uuidv4 } from 'uuid';

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface WeatherData {
  id: string;
  city: string;
  type: WeatherType;
  temperatureC: number;
  temperatureF: number;
  humidity: number;
  windSpeed: number;
  precipitationChance: number;
  icon: string;
  timestamp: number;
}

export const WEATHER_BG_COLORS: Record<WeatherType, string> = {
  sunny: '#87CEEB',
  cloudy: '#A9A9A9',
  rainy: '#4A4A4A',
  snowy: '#E0E0E0'
};

export const WEATHER_ICONS: Record<WeatherType, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  snowy: '❄️'
};

const WEATHER_TYPES: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'snowy'];

const CITY_PRESETS: Array<{ name: string; bias?: WeatherType[] }> = [
  { name: '北京', bias: ['sunny', 'cloudy'] },
  { name: '上海', bias: ['cloudy', 'rainy'] },
  { name: '广州', bias: ['rainy', 'sunny'] },
  { name: '哈尔滨', bias: ['snowy', 'cloudy'] },
  { name: '成都', bias: ['cloudy', 'rainy'] },
  { name: '昆明', bias: ['sunny', 'cloudy'] },
  { name: '西安', bias: ['sunny', 'cloudy'] },
  { name: '杭州', bias: ['rainy', 'cloudy'] },
  { name: '深圳', bias: ['sunny', 'rainy'] },
  { name: '三亚', bias: ['sunny'] },
  { name: '拉萨', bias: ['sunny', 'snowy'] },
  { name: '乌鲁木齐', bias: ['snowy', 'sunny'] }
];

function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function generateWeatherForType(type: WeatherType): Omit<WeatherData, 'id' | 'city' | 'type' | 'icon' | 'timestamp'> {
  switch (type) {
    case 'sunny':
      return {
        temperatureC: randomInt(22, 38),
        temperatureF: 0,
        humidity: randomInt(20, 55),
        windSpeed: randomInRange(2, 15),
        precipitationChance: randomInt(0, 15)
      };
    case 'cloudy':
      return {
        temperatureC: randomInt(12, 28),
        temperatureF: 0,
        humidity: randomInt(40, 75),
        windSpeed: randomInRange(5, 22),
        precipitationChance: randomInt(10, 45)
      };
    case 'rainy':
      return {
        temperatureC: randomInt(8, 24),
        temperatureF: 0,
        humidity: randomInt(70, 95),
        windSpeed: randomInRange(10, 35),
        precipitationChance: randomInt(60, 100)
      };
    case 'snowy':
      return {
        temperatureC: randomInt(-15, 2),
        temperatureF: 0,
        humidity: randomInt(55, 90),
        windSpeed: randomInRange(5, 28),
        precipitationChance: randomInt(50, 95)
      };
  }
}

function pickWeatherType(cityName: string): WeatherType {
  const preset = CITY_PRESETS.find(p => p.name === cityName);
  if (preset && preset.bias) {
    const biasedPool: WeatherType[] = [];
    preset.bias.forEach(t => {
      for (let i = 0; i < 3; i++) biasedPool.push(t);
    });
    WEATHER_TYPES.forEach(t => biasedPool.push(t));
    return biasedPool[randomInt(0, biasedPool.length - 1)];
  }
  return WEATHER_TYPES[randomInt(0, WEATHER_TYPES.length - 1)];
}

export function generateMockWeather(cityName: string): WeatherData {
  const trimmedCity = cityName.trim() || '未知城市';
  const type = pickWeatherType(trimmedCity);
  const base = generateWeatherForType(type);
  const tempF = celsiusToFahrenheit(base.temperatureC);

  return {
    id: uuidv4(),
    city: trimmedCity,
    type,
    temperatureC: base.temperatureC,
    temperatureF: tempF,
    humidity: base.humidity,
    windSpeed: Math.round(base.windSpeed * 10) / 10,
    precipitationChance: base.precipitationChance,
    icon: WEATHER_ICONS[type],
    timestamp: Date.now()
  };
}

export const WEATHER_UPDATE_EVENT = 'weather:update';
export const SETTINGS_CHANGE_EVENT = 'settings:change';

export interface SettingsPayload {
  particleDensity: 'low' | 'medium' | 'high';
}

export function dispatchWeatherUpdate(data: WeatherData): void {
  const event = new CustomEvent<WeatherData>(WEATHER_UPDATE_EVENT, { detail: data });
  window.dispatchEvent(event);
}

export function dispatchSettingsChange(payload: SettingsPayload): void {
  const event = new CustomEvent<SettingsPayload>(SETTINGS_CHANGE_EVENT, { detail: payload });
  window.dispatchEvent(event);
}

export function onWeatherUpdate(callback: (data: WeatherData) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<WeatherData>).detail);
  window.addEventListener(WEATHER_UPDATE_EVENT, handler);
  return () => window.removeEventListener(WEATHER_UPDATE_EVENT, handler);
}

export function onSettingsChange(callback: (payload: SettingsPayload) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<SettingsPayload>).detail);
  window.addEventListener(SETTINGS_CHANGE_EVENT, handler);
  return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handler);
}
