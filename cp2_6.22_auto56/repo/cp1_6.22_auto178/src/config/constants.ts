import type { PlantSpecies, SpeciesConfig, WeatherType, WeatherConfig, GrowthStage } from '@/types';

export const SPECIES_CONFIG: Record<PlantSpecies, SpeciesConfig> = {
  sunflower: {
    name: '向日葵',
    color: '#FBBF24',
    waterNeedPerSec: 1.2,
    optimalLight: 0.9,
    optimalTemp: 25,
    stageDurations: {
      seed: [3, 3],
      sprout: [15, 20],
      seedling: [18, 25],
      mature: [20, 28],
      flowering: [9999, 9999],
    },
    harvestReward: { sunflower: 2 },
    unlockRequirement: null,
    emoji: '🌻',
  },
  cactus: {
    name: '仙人掌',
    color: '#34D399',
    waterNeedPerSec: 0.3,
    optimalLight: 0.85,
    optimalTemp: 30,
    stageDurations: {
      seed: [3, 3],
      sprout: [20, 28],
      seedling: [22, 30],
      mature: [25, 30],
      flowering: [9999, 9999],
    },
    harvestReward: { cactus: 2 },
    unlockRequirement: { species: 'sunflower', count: 3 },
    emoji: '🌵',
  },
  dandelion: {
    name: '蒲公英',
    color: '#A78BFA',
    waterNeedPerSec: 0.8,
    optimalLight: 0.6,
    optimalTemp: 22,
    stageDurations: {
      seed: [3, 3],
      sprout: [12, 18],
      seedling: [15, 22],
      mature: [18, 25],
      flowering: [9999, 9999],
    },
    harvestReward: { dandelion: 3 },
    unlockRequirement: { species: 'cactus', count: 2 },
    emoji: '🌼',
  },
};

export const WEATHER_CONFIG: Record<WeatherType, WeatherConfig> = {
  sunny: {
    name: '晴天',
    lightMultiplier: 1.0,
    humidityChangePerSec: -0.3,
    precipitation: 'none',
    duration: [30, 45],
    icon: '☀️',
    tempMultiplier: 1.1,
  },
  cloudy: {
    name: '多云',
    lightMultiplier: 0.6,
    humidityChangePerSec: -0.1,
    precipitation: 'none',
    duration: [25, 40],
    icon: '☁️',
    tempMultiplier: 0.95,
  },
  rain: {
    name: '小雨',
    lightMultiplier: 0.4,
    humidityChangePerSec: 1.2,
    precipitation: 'light',
    duration: [20, 35],
    icon: '🌧️',
    tempMultiplier: 0.9,
  },
  thunderstorm: {
    name: '雷雨',
    lightMultiplier: 0.3,
    humidityChangePerSec: 2.0,
    precipitation: 'heavy',
    duration: [15, 25],
    icon: '⛈️',
    tempMultiplier: 0.85,
  },
  drought: {
    name: '干旱',
    lightMultiplier: 1.1,
    humidityChangePerSec: -1.0,
    precipitation: 'none',
    duration: [20, 30],
    icon: '🏜️',
    tempMultiplier: 1.3,
  },
};

export const DAY_DURATION_SEC = 60;
export const DAY_TRANSITION_SEC = 5;
export const NIGHT_BRIGHTNESS = 0.3;
export const DAY_BRIGHTNESS = 1.0;
export const DAY_COLOR_TEMP = { r: 255, g: 215, b: 0 };
export const NIGHT_COLOR_TEMP = { r: 30, g: 58, b: 95 };

export const STAGE_ORDER: GrowthStage[] = ['seed', 'sprout', 'seedling', 'mature', 'flowering'];

export const PLANT_SIZE: Record<GrowthStage, number> = {
  seed: 16,
  sprout: 24,
  seedling: 40,
  mature: 60,
  flowering: 75,
};

export const HARVEST_PARTICLE_COUNT = 30;
export const HARVEST_PARTICLE_LIFE = 0.8;

export const AUTO_IRRIGATOR_MAX = 3;
export const AUTO_IRRIGATOR_RADIUS = 80;
export const AUTO_IRRIGATOR_INTERVAL = 2;
export const AUTO_IRRIGATOR_HINT_THRESHOLD = 10;

export const MAX_OFFLINE_SIMULATION_SEC = 120;
export const SAVE_THROTTLE_MS = 1000;

export const STORAGE_KEY = 'plant_eco_simulator_save_v1';

export const DIRT_COLOR = '#D4A373';
export const DIRT_PATTERN_UNIT = 8;
