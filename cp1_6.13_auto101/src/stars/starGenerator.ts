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
  const rand = Math.random();
  let cumulative = 0;

  for (const type of SPECTRAL_TYPES) {
    cumulative += SPECTRAL_DISTRIBUTION[type];
    if (rand < cumulative) {
      return type;
    }
  }

  return 'M';
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

function generateStar(index: number): StarData {
  const spectralType = getRandomSpectralType();
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

  for (let i = 0; i < count; i++) {
    stars.push(generateStar(i));
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
