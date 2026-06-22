export type FishSpecies = '草鱼' | '鲤鱼' | '鲈鱼' | '小龙虾';

export enum FishSize {
  Small = '小',
  Medium = '中',
  Large = '大',
}

export interface Fish {
  id: string;
  species: FishSpecies;
  size: FishSize;
  health: number;
  growthProgress: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDead: boolean;
  directionChangeTimer: number;
}

interface FishConfigEntry {
  growthRate: number;
  fryPrice: number;
  pixelColor: string;
  oxygenRequirement: '低' | '中' | '中高' | '高';
  temperatureRange: [number, number];
}

export const FISH_CONFIG: Record<FishSpecies, FishConfigEntry> = {
  草鱼: {
    growthRate: 1.2,
    fryPrice: 5,
    pixelColor: '#4A7C59',
    oxygenRequirement: '中',
    temperatureRange: [18, 30],
  },
  鲤鱼: {
    growthRate: 1.0,
    fryPrice: 8,
    pixelColor: '#E67E22',
    oxygenRequirement: '中高',
    temperatureRange: [15, 32],
  },
  鲈鱼: {
    growthRate: 0.8,
    fryPrice: 12,
    pixelColor: '#BDC3C7',
    oxygenRequirement: '高',
    temperatureRange: [20, 28],
  },
  小龙虾: {
    growthRate: 1.5,
    fryPrice: 6,
    pixelColor: '#C0392B',
    oxygenRequirement: '低',
    temperatureRange: [16, 30],
  },
};
