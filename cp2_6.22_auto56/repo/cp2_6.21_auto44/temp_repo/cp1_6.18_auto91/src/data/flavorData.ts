import { v4 as uuidv4 } from 'uuid';
import {
  PresetFlavor,
  FlavorProfile,
  FlavorScores,
  FlavorDimension,
  DIMENSION_ORDER,
  COLOR_PALETTE,
} from '@/shared/types';

export const PRESET_FLAVORS: PresetFlavor[] = [
  {
    id: 'preset-soy',
    name: '酱油',
    scores: { salt: 9, sweet: 3, sour: 2, umami: 8, bitter: 3, spicy: 0 },
  },
  {
    id: 'preset-vinegar',
    name: '醋',
    scores: { salt: 1, sweet: 1, sour: 9, umami: 2, bitter: 2, spicy: 0 },
  },
  {
    id: 'preset-honey',
    name: '蜂蜜',
    scores: { salt: 0, sweet: 10, sour: 1, umami: 1, bitter: 0, spicy: 0 },
  },
  {
    id: 'preset-chili-oil',
    name: '辣椒油',
    scores: { salt: 3, sweet: 0, sour: 0, umami: 2, bitter: 1, spicy: 10 },
  },
  {
    id: 'preset-lemon',
    name: '柠檬汁',
    scores: { salt: 0, sweet: 3, sour: 10, umami: 0, bitter: 1, spicy: 0 },
  },
  {
    id: 'preset-mustard',
    name: '芥末',
    scores: { salt: 2, sweet: 0, sour: 2, umami: 3, bitter: 5, spicy: 8 },
  },
  {
    id: 'preset-oyster',
    name: '蚝油',
    scores: { salt: 6, sweet: 4, sour: 1, umami: 9, bitter: 2, spicy: 0 },
  },
  {
    id: 'preset-fish-sauce',
    name: '鱼露',
    scores: { salt: 10, sweet: 1, sour: 2, umami: 8, bitter: 3, spicy: 0 },
  },
];

export function createEmptyScores(): FlavorScores {
  return { salt: 0, sweet: 0, sour: 0, umami: 0, bitter: 0, spicy: 0 };
}

export function getColorByIndex(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

export function createProfileFromPreset(preset: PresetFlavor, index: number): FlavorProfile {
  return {
    id: uuidv4(),
    name: preset.name,
    scores: { ...preset.scores },
    color: getColorByIndex(index),
    visible: true,
  };
}

export function createCustomProfile(name: string, index: number): FlavorProfile {
  return {
    id: uuidv4(),
    name: name.trim() || '自定义调味料',
    scores: createEmptyScores(),
    color: getColorByIndex(index),
    visible: true,
  };
}

export function calculateAverageScores(profiles: FlavorProfile[]): FlavorScores {
  const visibleProfiles = profiles.filter((p) => p.visible);
  if (visibleProfiles.length === 0) {
    return createEmptyScores();
  }

  const result = createEmptyScores();
  DIMENSION_ORDER.forEach((dim) => {
    const sum = visibleProfiles.reduce((acc, p) => acc + p.scores[dim], 0);
    result[dim] = sum / visibleProfiles.length;
  });
  return result;
}

export function calculateBalanceScore(scores: FlavorScores): number {
  const values = DIMENSION_ORDER.map((d) => scores[d]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const maxVariance = Math.pow(10 - 0, 2) * 6 / 6;
  const normalized = Math.max(0, 100 - (variance / maxVariance) * 100);
  return Math.round(normalized);
}

export function calculateEuclideanDistance(a: FlavorScores, b: FlavorScores): number {
  return Math.sqrt(
    DIMENSION_ORDER.reduce((acc, dim) => acc + Math.pow(a[dim] - b[dim], 2), 0),
  );
}

export function findRecommendedPreset(
  targetScores: FlavorScores,
  excludeIds: string[] = [],
): PresetFlavor | null {
  const candidates = PRESET_FLAVORS.filter((p) => !excludeIds.includes(p.id));
  if (candidates.length === 0) return null;

  let best: PresetFlavor | null = null;
  let bestDistance = Infinity;

  for (const preset of candidates) {
    const distance = calculateEuclideanDistance(targetScores, preset.scores);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = preset;
    }
  }

  return best;
}

export function getPresetById(id: string): PresetFlavor | undefined {
  return PRESET_FLAVORS.find((p) => p.id === id);
}

export function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function updateProfileScore(
  profile: FlavorProfile,
  dimension: FlavorDimension,
  value: number,
): FlavorProfile {
  return {
    ...profile,
    scores: {
      ...profile.scores,
      [dimension]: clampScore(value, 0, 10),
    },
  };
}
