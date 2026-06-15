export enum GrowthStage {
  Seed = 0,
  Sprout = 1,
  Mature = 2,
  Flowering = 3
}

export type PlantType =
  | 'sunflower'
  | 'lavender'
  | 'cactus'
  | 'fern'
  | 'rose'
  | 'tomato'
  | 'mint'
  | 'succulent';

export interface PlantConfig {
  name: string;
  emoji: string;
  stagesEmoji: string[];
  optimalLight: number;
  optimalWater: number;
  optimalNutrients: number;
  growthSpeed: number;
  description: string;
}

export interface PlantState {
  id: string;
  type: PlantType;
  stage: GrowthStage;
  growthProgress: number;
  health: number;
  tag?: string;
  plantedAt: number;
  lastGrowthCheck: number;
  gridIndex: number;
}

export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  sunflower: {
    name: '向日葵',
    emoji: '🌻',
    stagesEmoji: ['🌱', '🌿', '🌾', '🌻'],
    optimalLight: 85,
    optimalWater: 60,
    optimalNutrients: 50,
    growthSpeed: 1.0,
    description: '喜阳植物，需要充足的光照'
  },
  lavender: {
    name: '薰衣草',
    emoji: '💜',
    stagesEmoji: ['🌱', '🌿', '🪻', '💜'],
    optimalLight: 75,
    optimalWater: 35,
    optimalNutrients: 40,
    growthSpeed: 0.9,
    description: '耐旱植物，喜欢干燥环境'
  },
  cactus: {
    name: '仙人掌',
    emoji: '🌵',
    stagesEmoji: ['🌱', '🪴', '🌵', '🌸'],
    optimalLight: 90,
    optimalWater: 15,
    optimalNutrients: 25,
    growthSpeed: 0.7,
    description: '沙漠植物，极耐旱'
  },
  fern: {
    name: '蕨类',
    emoji: '🌿',
    stagesEmoji: ['🌱', '🍃', '🌿', '🌴'],
    optimalLight: 40,
    optimalWater: 80,
    optimalNutrients: 55,
    growthSpeed: 1.1,
    description: '喜阴湿植物，需要大量水分'
  },
  rose: {
    name: '玫瑰',
    emoji: '🌹',
    stagesEmoji: ['🌱', '🌿', '🥀', '🌹'],
    optimalLight: 70,
    optimalWater: 65,
    optimalNutrients: 70,
    growthSpeed: 0.85,
    description: '需要精心呵护的花卉'
  },
  tomato: {
    name: '番茄',
    emoji: '🍅',
    stagesEmoji: ['🌱', '🌿', '🪴', '🍅'],
    optimalLight: 80,
    optimalWater: 70,
    optimalNutrients: 75,
    growthSpeed: 1.15,
    description: '果蔬植物，需要充足养分'
  },
  mint: {
    name: '薄荷',
    emoji: '🌱',
    stagesEmoji: ['🌱', '🍃', '🌿', '🌿'],
    optimalLight: 60,
    optimalWater: 75,
    optimalNutrients: 50,
    growthSpeed: 1.3,
    description: '生长迅速的香草植物'
  },
  succulent: {
    name: '多肉',
    emoji: '🪴',
    stagesEmoji: ['🌱', '🪴', '🌵', '🌸'],
    optimalLight: 65,
    optimalWater: 25,
    optimalNutrients: 30,
    growthSpeed: 0.6,
    description: '可爱的多肉植物，易养护'
  }
};

export function calculateGrowthRate(
  plantType: PlantType,
  light: number,
  water: number,
  nutrients: number
): number {
  const config = PLANT_CONFIGS[plantType];

  const lightDiff = Math.abs(light - config.optimalLight) / 100;
  const waterDiff = Math.abs(water - config.optimalWater) / 100;
  const nutrientDiff = Math.abs(nutrients - config.optimalNutrients) / 100;

  const lightFactor = Math.max(0, 1 - lightDiff * 1.5);
  const waterFactor = Math.max(0, 1 - waterDiff * 1.5);
  const nutrientFactor = Math.max(0, 1 - nutrientDiff * 1.5);

  const weightedAverage = (lightFactor * 0.4 + waterFactor * 0.35 + nutrientFactor * 0.25);

  return Math.max(0.05, weightedAverage * config.growthSpeed);
}

export function advanceGrowth(
  plant: PlantState,
  light: number,
  water: number,
  nutrients: number,
  deltaSeconds: number
): { plant: PlantState; stageChanged: boolean; newStage?: GrowthStage } {
  const growthRate = calculateGrowthRate(plant.type, light, water, nutrients);

  const progressPerSecond = growthRate * 0.5;
  const progressIncrease = progressPerSecond * deltaSeconds;

  let newProgress = plant.growthProgress + progressIncrease;
  let newStage = plant.stage;
  let stageChanged = false;

  while (newProgress >= 100 && newStage < GrowthStage.Flowering) {
    newProgress -= 100;
    newStage = (newStage + 1) as GrowthStage;
    stageChanged = true;
  }

  if (newStage >= GrowthStage.Flowering) {
    newProgress = Math.min(100, newProgress);
  }

  const healthChange = (growthRate - 0.3) * deltaSeconds * 0.01;
  const newHealth = Math.max(0, Math.min(100, plant.health + healthChange));

  return {
    plant: {
      ...plant,
      stage: newStage,
      growthProgress: newProgress,
      health: newHealth,
      lastGrowthCheck: Date.now()
    },
    stageChanged,
    newStage: stageChanged ? newStage : undefined
  };
}

export function getCareAdvice(
  plantType: PlantType,
  light: number,
  water: number,
  nutrients: number
): string[] {
  const config = PLANT_CONFIGS[plantType];
  const advice: string[] = [];

  const lightDiff = light - config.optimalLight;
  const waterDiff = water - config.optimalWater;
  const nutrientDiff = nutrients - config.optimalNutrients;

  if (Math.abs(lightDiff) > 20) {
    if (lightDiff < 0) {
      advice.push(`光照偏低，建议增加光照`);
    } else {
      advice.push(`光照偏强，建议适当遮阴`);
    }
  }

  if (Math.abs(waterDiff) > 20) {
    if (waterDiff < 0) {
      advice.push(`水分偏低，建议增加浇水`);
    } else {
      advice.push(`水分偏多，建议减少浇水`);
    }
  }

  if (Math.abs(nutrientDiff) > 25) {
    if (nutrientDiff < 0) {
      advice.push(`养分不足，建议施肥`);
    } else {
      advice.push(`养分过剩，建议减少施肥`);
    }
  }

  if (advice.length === 0) {
    advice.push(`环境适宜，继续保持！`);
  }

  return advice;
}

export function getStageName(stage: GrowthStage): string {
  switch (stage) {
    case GrowthStage.Seed:
      return '种子期';
    case GrowthStage.Sprout:
      return '幼苗期';
    case GrowthStage.Mature:
      return '成熟期';
    case GrowthStage.Flowering:
      return '开花/结果期';
  }
}
