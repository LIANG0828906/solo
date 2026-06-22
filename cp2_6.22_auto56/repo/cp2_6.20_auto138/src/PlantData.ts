export interface PlantSpecies {
  id: string;
  name: string;
  description: string;
  stemHeight: number;
  stemRadius: number;
  leafCount: number;
  leafSize: number;
  leafSpiralTightness: number;
  hasFlower: boolean;
  flowerSize: number;
  petalCount: number;
  colorPalette: {
    stemBottom: string;
    stemTop: string;
    leaves: string;
    flower: string;
    flowerCenter: string;
  };
  iconColor: string;
}

export const PLANTS: PlantSpecies[] = [
  {
    id: 'sunflower',
    name: '向日葵',
    description: '向阳而生的金色花朵，茎干挺拔，叶片宽大',
    stemHeight: 2.5,
    stemRadius: 0.08,
    leafCount: 8,
    leafSize: 0.6,
    leafSpiralTightness: 0.8,
    hasFlower: true,
    flowerSize: 0.8,
    petalCount: 16,
    colorPalette: {
      stemBottom: '#1a4d1a',
      stemTop: '#3d8b3d',
      leaves: '#4a9f4a',
      flower: '#ffd700',
      flowerCenter: '#8b4513',
    },
    iconColor: '#ffd700',
  },
  {
    id: 'cactus',
    name: '仙人掌',
    description: '耐旱的沙漠植物，肉质茎干，刺状叶片',
    stemHeight: 1.8,
    stemRadius: 0.25,
    leafCount: 0,
    leafSize: 0,
    leafSpiralTightness: 0,
    hasFlower: true,
    flowerSize: 0.35,
    petalCount: 8,
    colorPalette: {
      stemBottom: '#2d5a3d',
      stemTop: '#4a8b6a',
      leaves: '#5a9b7a',
      flower: '#ff6b9d',
      flowerCenter: '#ffd1dc',
    },
    iconColor: '#4a8b6a',
  },
  {
    id: 'fern',
    name: '蕨类',
    description: '喜阴湿的古老植物，羽状复叶轻盈飘逸',
    stemHeight: 1.2,
    stemRadius: 0.04,
    leafCount: 12,
    leafSize: 0.8,
    leafSpiralTightness: 1.2,
    hasFlower: false,
    flowerSize: 0,
    petalCount: 0,
    colorPalette: {
      stemBottom: '#2d4a2d',
      stemTop: '#5a8a5a',
      leaves: '#6b9b6b',
      flower: '#ffffff',
      flowerCenter: '#ffffff',
    },
    iconColor: '#6b9b6b',
  },
  {
    id: 'redmaple',
    name: '红枫',
    description: '秋日红叶如霞，掌状叶片优美舒展',
    stemHeight: 2.2,
    stemRadius: 0.1,
    leafCount: 10,
    leafSize: 0.55,
    leafSpiralTightness: 0.9,
    hasFlower: false,
    flowerSize: 0,
    petalCount: 0,
    colorPalette: {
      stemBottom: '#4a2c1a',
      stemTop: '#6b3d2a',
      leaves: '#dc3545',
      flower: '#ffffff',
      flowerCenter: '#ffffff',
    },
    iconColor: '#dc3545',
  },
  {
    id: 'succulent',
    name: '多肉',
    description: '肥厚多汁的可爱植物，叶片饱满圆润',
    stemHeight: 0.5,
    stemRadius: 0.06,
    leafCount: 10,
    leafSize: 0.35,
    leafSpiralTightness: 1.5,
    hasFlower: true,
    flowerSize: 0.25,
    petalCount: 6,
    colorPalette: {
      stemBottom: '#3d6b5a',
      stemTop: '#7ab89a',
      leaves: '#8fbc8f',
      flower: '#e6a8d7',
      flowerCenter: '#fff0f5',
    },
    iconColor: '#8fbc8f',
  },
];

export const DEFAULT_PLANT_ID = 'sunflower';

export const DEFAULT_ENVIRONMENT = {
  light: 50,
  water: 50,
  temperature: 25,
};

export const GROWTH_STAGES = {
  seedling: { label: '幼苗期', threshold: 0.2 },
  growing: { label: '生长期', threshold: 0.6 },
  mature: { label: '成熟期', threshold: 1.0 },
};
