import { CoralSpeciesType } from '../store/useStore';

export interface CoralSpeciesParams {
  name: string;
  type: CoralSpeciesType;
  branchCount: number;
  growthRate: number;
  colorStart: string;
  colorEnd: string;
  lightSensitivity: number;
  maxHeight: number;
  branchLength: number;
  segments: number;
}

export const CoralSpecies: Record<CoralSpeciesType, CoralSpeciesParams> = {
  acropora: {
    name: '鹿角珊瑚',
    type: 'acropora',
    branchCount: 8,
    growthRate: 0.015,
    colorStart: '#FF6F00',
    colorEnd: '#FF80AB',
    lightSensitivity: 0.8,
    maxHeight: 6,
    branchLength: 3,
    segments: 6,
  },
  pocillopora: {
    name: '针叶珊瑚',
    type: 'pocillopora',
    branchCount: 12,
    growthRate: 0.012,
    colorStart: '#4A148C',
    colorEnd: '#CE93D8',
    lightSensitivity: 0.6,
    maxHeight: 4.5,
    branchLength: 2.2,
    segments: 5,
  },
  montipora: {
    name: '叶片珊瑚',
    type: 'montipora',
    branchCount: 6,
    growthRate: 0.008,
    colorStart: '#558B2F',
    colorEnd: '#AED581',
    lightSensitivity: 1.0,
    maxHeight: 4,
    branchLength: 2.5,
    segments: 4,
  },
};

export function getGrowthMultiplier(
  species: CoralSpeciesType,
  lightIntensity: number,
  waterTemperature: number
): number {
  const params = CoralSpecies[species];
  let multiplier = 1;

  const lightFactor = Math.min(1, lightIntensity * params.lightSensitivity);
  if (lightIntensity < 0.5) {
    multiplier *= 0.1;
  } else {
    multiplier *= lightFactor;
  }

  if (waterTemperature < 24) {
    multiplier *= 0.8;
  } else if (waterTemperature > 28) {
    multiplier *= 0.7;
  } else {
    const optimalTemp = 26;
    const tempDiff = Math.abs(waterTemperature - optimalTemp);
    multiplier *= 1 - tempDiff * 0.05;
  }

  return multiplier;
}

export function getCoralColor(
  species: CoralSpeciesType,
  age: number,
  health: number
): { r: number; g: number; b: number } {
  const params = CoralSpecies[species];
  const startColor = hexToRgb(params.colorStart);
  const endColor = hexToRgb(params.colorEnd);

  let t: number;
  if (age < 30) {
    t = age / 30 * 0.3;
  } else if (age < 120) {
    t = 0.3 + ((age - 30) / 90) * 0.7;
  } else {
    t = 1;
  }

  const r = startColor.r + (endColor.r - startColor.r) * t;
  const g = startColor.g + (endColor.g - startColor.g) * t;
  const b = startColor.b + (endColor.b - startColor.b) * t;

  const saturation = health;
  const gray = (r + g + b) / 3;

  return {
    r: gray + (r - gray) * saturation,
    g: gray + (g - gray) * saturation,
    b: gray + (b - gray) * saturation,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

export function getLodGeometry(
  species: CoralSpeciesType,
  lodLevel: number
): { segments: number; branchCount: number } {
  const params = CoralSpecies[species];
  const reduction = Math.pow(0.2, lodLevel);
  return {
    segments: Math.max(2, Math.floor(params.segments * reduction)),
    branchCount: Math.max(3, Math.floor(params.branchCount * reduction)),
  };
}
