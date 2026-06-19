import { MaterialType, MaterialConfig } from '../types';

export const MATERIALS: Record<MaterialType, MaterialConfig> = {
  wood: {
    name: '木材',
    color: '#D2B48C',
    absorption: {
      low: 0.1,
      mid: 0.15,
      high: 0.2,
    },
  },
  marble: {
    name: '大理石',
    color: '#E8E0D0',
    absorption: {
      low: 0.02,
      mid: 0.03,
      high: 0.05,
    },
  },
  glass: {
    name: '玻璃',
    color: '#B0E0E6',
    absorption: {
      low: 0.05,
      mid: 0.08,
      high: 0.12,
    },
  },
  acoustic: {
    name: '吸音棉',
    color: '#A9A9A9',
    absorption: {
      low: 0.3,
      mid: 0.7,
      high: 0.9,
    },
  },
};

export const getAbsorptionCoefficient = (
  material: MaterialType,
  frequencyBand: 'low' | 'mid' | 'high'
): number => {
  return MATERIALS[material].absorption[frequencyBand];
};

export const getMaterialColor = (material: MaterialType): string => {
  return MATERIALS[material].color;
};

export const getMaterialName = (material: MaterialType): string => {
  return MATERIALS[material].name;
};
