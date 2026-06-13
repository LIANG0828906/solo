import {
  StarData,
  SpectralType,
  SPECTRAL_TYPES,
  TEMPERATURE_RANGES,
  SPECTRAL_DISTRIBUTION,
} from './types';
import { temperatureToRGB } from '../utils/color';

function generateId(): string {
  return `star-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateName(): string {
  const number = Math.floor(Math.random() * 99999) + 1;
  return `HD-${number.toString().padStart(5, '0')}`;
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomPosition(): { x: number; y: number; z: number } {
  const radius = randomRange(20, 80);
  const theta = randomRange(0, Math.PI * 2);
  const phi = randomRange(0, Math.PI);

  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi),
  };
}

function getRandomSpectralType(): SpectralType {
  const total = SPECTRAL_TYPES.reduce((sum, type) => sum + SPECTRAL_DISTRIBUTION[type], 0);
  const rand = Math.random() * total;
  let cumulative = 0;

  for (const type of SPECTRAL_TYPES) {
    cumulative += SPECTRAL_DISTRIBUTION[type];
    if (rand < cumulative) {
      return type;
    }
  }

  return 'M';
}

function getWeightedRandomSpectralType(count: number): SpectralType[] {
  const result: SpectralType[] = [];
  const counts: Record<SpectralType, number> = {
    O: 0, B: 0, A: 0, F: 0, G: 0, K: 0, M: 0,
  };

  for (const type of SPECTRAL_TYPES) {
    counts[type] = Math.max(0, Math.floor(count * SPECTRAL_DISTRIBUTION[type]));
  }

  let allocated = SPECTRAL_TYPES.reduce((sum, t) => sum + counts[t], 0);
  const remaining = count - allocated;

  const fractions: { type: SpectralType; frac: number }[] = SPECTRAL_TYPES.map((type) => ({
    type,
    frac: (count * SPECTRAL_DISTRIBUTION[type]) % 1,
  }));
  fractions.sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remaining; i++) {
    counts[fractions[i % fractions.length].type]++;
  }

  for (const type of SPECTRAL_TYPES) {
    for (let i = 0; i < counts[type]; i++) {
      result.push(type);
    }
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function calculateSize(absoluteMagnitude: number): number {
  const minSize = 0.3;
  const maxSize = 2.0;
  const minMag = -10;
  const maxMag = 20;

  const normalized = (absoluteMagnitude - minMag) / (maxMag - minMag);
  const size = maxSize - normalized * (maxSize - minSize);

  return Math.max(minSize, Math.min(maxSize, size));
}

function generateStar(spectralType: SpectralType): StarData {
  const [tempMin, tempMax] = TEMPERATURE_RANGES[spectralType];
  const temperature = Math.round(randomRange(tempMin, tempMax));

  const absoluteMagnitude = Math.round(randomRange(-5, 15) * 10) / 10;

  const color = temperatureToRGB(temperature);
  const size = calculateSize(absoluteMagnitude);
  const position = randomPosition();

  return {
    id: generateId(),
    name: generateName(),
    spectralType,
    temperature,
    absoluteMagnitude,
    color,
    size,
    position,
  };
}

export function generateStars(count: number = 300): StarData[] {
  const stars: StarData[] = [];
  const spectralTypes = getWeightedRandomSpectralType(count);

  for (let i = 0; i < count; i++) {
    stars.push(generateStar(spectralTypes[i]));
  }

  return stars;
}

export function getStarCountByType(stars: StarData[]): Record<SpectralType, number> {
  const counts: Record<SpectralType, number> = {
    O: 0,
    B: 0,
    A: 0,
    F: 0,
    G: 0,
    K: 0,
    M: 0,
  };

  for (const star of stars) {
    counts[star.spectralType]++;
  }

  return counts;
}
