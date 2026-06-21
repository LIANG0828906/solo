export type CropType = 'carrot' | 'tomato' | 'pumpkin';
export type GrowthStage = 'seed' | 'sprout' | 'mature';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy';

export interface CropConfig {
  name: string;
  seedPrice: number;
  harvestReward: number;
  growthTime: number;
  color: string;
  icon: string;
}

export interface PlotData {
  id: number;
  crop: CropType | null;
  stage: GrowthStage;
  growthProgress: number;
  plantedAt: number | null;
  hasPest: boolean;
  pestStartTime: number | null;
  growthPaused: boolean;
  pauseStartTime: number | null;
  yieldMultiplier: number;
  plantingAnimation: boolean;
}

export const CROP_CONFIGS: Record<CropType, CropConfig> = {
  carrot: {
    name: '胡萝卜',
    seedPrice: 2,
    harvestReward: 4,
    growthTime: 30,
    color: '#ff7043',
    icon: '🥕',
  },
  tomato: {
    name: '番茄',
    seedPrice: 3,
    harvestReward: 7,
    growthTime: 45,
    color: '#e53935',
    icon: '🍅',
  },
  pumpkin: {
    name: '南瓜',
    seedPrice: 5,
    harvestReward: 12,
    growthTime: 60,
    color: '#fb8c00',
    icon: '🎃',
  },
};

export class CropManager {
  static getStageName(stage: GrowthStage): string {
    const names: Record<GrowthStage, string> = {
      seed: '种子',
      sprout: '幼芽',
      mature: '成熟',
    };
    return names[stage];
  }

  static getCropConfig(cropType: CropType): CropConfig {
    return CROP_CONFIGS[cropType];
  }

  static calculateRemainingTime(plot: PlotData): number {
    if (!plot.crop || !plot.plantedAt || plot.stage === 'mature') {
      return 0;
    }
    const config = CROP_CONFIGS[plot.crop];
    const elapsed = (Date.now() - plot.plantedAt) / 1000;
    const remaining = Math.max(0, config.growthTime - elapsed);
    return Math.ceil(remaining);
  }

  static calculateHarvestReward(plot: PlotData): number {
    if (!plot.crop || plot.stage !== 'mature') {
      return 0;
    }
    const config = CROP_CONFIGS[plot.crop];
    return Math.floor(config.harvestReward * plot.yieldMultiplier);
  }

  static getProgressPercentage(plot: PlotData): number {
    if (!plot.crop || plot.stage === 'mature') {
      return 100;
    }
    return Math.floor(plot.growthProgress * 100);
  }

  static getStageColor(plot: PlotData): string {
    if (!plot.crop) {
      return '#8d6e63';
    }
    if (plot.stage === 'mature') {
      return '#fdd835';
    }
    if (plot.hasPest) {
      return '#f44336';
    }
    const config = CROP_CONFIGS[plot.crop];
    if (plot.stage === 'seed') {
      return '#a5d6a7';
    }
    return config.color;
  }
}
