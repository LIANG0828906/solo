import type { WeatherType, WeatherData, PlantSpecies, PlantSpeciesInfo } from '../types';

const WEATHER_TYPES: WeatherType[] = ['sunny', 'cloudy', 'overcast', 'rainy', 'snowy'];

const WEATHER_CONFIG: Record<WeatherType, { tempRange: [number, number]; baseHumidity: number }> = {
  sunny: { tempRange: [25, 35], baseHumidity: 30 },
  cloudy: { tempRange: [18, 28], baseHumidity: 50 },
  overcast: { tempRange: [15, 22], baseHumidity: 65 },
  rainy: { tempRange: [10, 20], baseHumidity: 85 },
  snowy: { tempRange: [-5, 5], baseHumidity: 70 }
};

export const WEATHER_ICONS: Record<WeatherType, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  overcast: '☁️',
  rainy: '🌧️',
  snowy: '❄️'
};

export const WEATHER_NAMES: Record<WeatherType, string> = {
  sunny: '晴天',
  cloudy: '多云',
  overcast: '阴天',
  rainy: '雨天',
  snowy: '雪天'
};

function randomInRange(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateWeather(): WeatherData {
  const type = pickRandom(WEATHER_TYPES);
  const config = WEATHER_CONFIG[type];
  const forecast: WeatherType[] = [];
  
  for (let i = 0; i < 4; i++) {
    forecast.push(pickRandom(WEATHER_TYPES));
  }

  return {
    type,
    temperature: randomInRange(config.tempRange[0], config.tempRange[1]),
    humidity: randomInRange(config.baseHumidity - 10, config.baseHumidity + 10),
    forecast,
    updatedAt: Date.now()
  };
}

export function generateWeatherForecast(): WeatherType[] {
  const forecast: WeatherType[] = [];
  for (let i = 0; i < 4; i++) {
    forecast.push(pickRandom(WEATHER_TYPES));
  }
  return forecast;
}

export const PLANT_SPECIES: Record<PlantSpecies, PlantSpeciesInfo> = {
  sunflower: {
    id: 'sunflower',
    name: '向日葵',
    description: '喜欢阳光的花朵，晴天生长更快',
    baseGrowthRate: 1.2,
    waterNeed: 0.7,
    nutrientNeed: 0.6,
    weatherPreference: ['sunny', 'cloudy'],
    color: '#FFD93D'
  },
  cactus: {
    id: 'cactus',
    name: '仙人掌',
    description: '耐旱植物，不需要太多水分',
    baseGrowthRate: 0.8,
    waterNeed: 0.2,
    nutrientNeed: 0.4,
    weatherPreference: ['sunny', 'overcast'],
    color: '#6BCB77'
  },
  mushroom: {
    id: 'mushroom',
    name: '蘑菇',
    description: '喜阴湿环境，雨天生长旺盛',
    baseGrowthRate: 1.0,
    waterNeed: 0.9,
    nutrientNeed: 0.5,
    weatherPreference: ['rainy', 'overcast', 'cloudy'],
    color: '#FF6B6B'
  }
};

export function getPlantSpeciesList(): PlantSpeciesInfo[] {
  return Object.values(PLANT_SPECIES);
}
