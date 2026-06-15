import type { RegionType, RegionConfig, WeatherType } from './types';

export const REGIONS: Record<RegionType, RegionConfig> = {
  forest: {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    weatherWeights: { sunny: 0.15, rainy: 0.6, snowy: 0.1, stormy: 0.15 },
    transitionDuration: 2000,
  },
  desert: {
    id: 'desert',
    name: '沙漠',
    icon: '🏜️',
    weatherWeights: { sunny: 0.85, rainy: 0.05, snowy: 0, stormy: 0.1 },
    transitionDuration: 2000,
  },
  snowfield: {
    id: 'snowfield',
    name: '雪原',
    icon: '❄️',
    weatherWeights: { sunny: 0.2, rainy: 0.05, snowy: 0.7, stormy: 0.05 },
    transitionDuration: 2000,
  },
  town: {
    id: 'town',
    name: '城镇',
    icon: '🏙️',
    weatherWeights: { sunny: 0.3, rainy: 0.3, snowy: 0.15, stormy: 0.25 },
    transitionDuration: 2000,
  },
};

export const REGION_LIST: RegionType[] = ['forest', 'desert', 'snowfield', 'town'];

export function getRegionConfig(regionId: RegionType): RegionConfig {
  return REGIONS[regionId];
}

export function pickWeatherForRegion(regionId: RegionType): WeatherType {
  const config = REGIONS[regionId];
  const weights = config.weatherWeights;
  const entries = Object.entries(weights) as [WeatherType, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;

  for (const [weather, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return weather;
  }

  return entries[0][0];
}

export function getTransitionDuration(regionId: RegionType): number {
  return REGIONS[regionId].transitionDuration;
}
