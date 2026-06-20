import type { WaveData, Reflection, Refraction, Hypocenter } from '@/types';
import { GEOLOGIC_LAYERS, ANIMATION_DURATION } from '@/types';

const POISSON_RATIO = 0.25;
const MAX_REFLECTIONS = 8;
const MAX_REFRACTIONS = 8;

export function calculateWaveSpeeds(
  elasticityGPa: number,
  densityKgM3: number
): { pWaveSpeed: number; sWaveSpeed: number; surfaceWaveSpeed: number } {
  const elasticityPa = elasticityGPa * 1e9;
  const density = densityKgM3;

  const numeratorP = elasticityPa * (1 - POISSON_RATIO);
  const denominatorP = density * (1 + POISSON_RATIO) * (1 - 2 * POISSON_RATIO);
  const pWaveSpeed = Math.sqrt(numeratorP / denominatorP);

  const sWaveSpeed = pWaveSpeed * 0.6;

  const surfaceWaveSpeed = sWaveSpeed * 0.92;

  return {
    pWaveSpeed: pWaveSpeed / 1000,
    sWaveSpeed: sWaveSpeed / 1000,
    surfaceWaveSpeed: surfaceWaveSpeed / 1000,
  };
}

export function getLayerAtY(y: number): typeof GEOLOGIC_LAYERS[number] | null {
  for (const layer of GEOLOGIC_LAYERS) {
    if (y >= layer.yMin && y < layer.yMax) {
      return layer;
    }
  }
  return null;
}

export function findLayerBoundaries(
  startY: number,
  endY: number
): Array<{ y: number; boundary: 'upper' | 'lower'; layer: typeof GEOLOGIC_LAYERS[number] }> {
  const boundaries: Array<{
    y: number;
    boundary: 'upper' | 'lower';
    layer: typeof GEOLOGIC_LAYERS[number];
  }> = [];

  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);

  for (const layer of GEOLOGIC_LAYERS) {
    if (layer.yMin >= minY && layer.yMin <= maxY) {
      boundaries.push({ y: layer.yMin, boundary: 'upper', layer });
    }
    if (layer.yMax >= minY && layer.yMax <= maxY) {
      boundaries.push({ y: layer.yMax, boundary: 'lower', layer });
    }
  }

  return boundaries.sort((a, b) => a.y - b.y);
}

export class WaveSimulator {
  private hypocenter: Hypocenter;
  private pWaveSpeed: number;
  private sWaveSpeed: number;
  private surfaceWaveSpeed: number;
  private reflections: Reflection[] = [];
  private refractions: Refraction[] = [];
  private processedBoundaries = new Set<string>();

  constructor(
    hypocenter: Hypocenter,
    _elasticity: number,
    _density: number
  ) {
    this.hypocenter = hypocenter;
    const speeds = calculateWaveSpeeds(_elasticity, _density);
    this.pWaveSpeed = speeds.pWaveSpeed;
    this.sWaveSpeed = speeds.sWaveSpeed;
    this.surfaceWaveSpeed = speeds.surfaceWaveSpeed;
  }

  updateParams(
    hypocenter: Hypocenter,
    elasticity: number,
    density: number
  ): void {
    this.hypocenter = hypocenter;
    const speeds = calculateWaveSpeeds(elasticity, density);
    this.pWaveSpeed = speeds.pWaveSpeed;
    this.sWaveSpeed = speeds.sWaveSpeed;
    this.surfaceWaveSpeed = speeds.surfaceWaveSpeed;
    this.reset();
  }

  reset(): void {
    this.reflections = [];
    this.refractions = [];
    this.processedBoundaries.clear();
  }

  getWaveData(time: number): WaveData {
    const clampedTime = Math.max(0, Math.min(time, ANIMATION_DURATION));

    const pWaveRadius = this.pWaveSpeed * clampedTime;
    const sWaveRadius = this.sWaveSpeed * clampedTime;
    const surfaceWaveRadius = this.surfaceWaveSpeed * clampedTime;

    this.updateBoundaryInteractions(pWaveRadius);

    return {
      pWaveRadius,
      sWaveRadius,
      surfaceWaveRadius,
      pWaveSpeed: this.pWaveSpeed,
      sWaveSpeed: this.sWaveSpeed,
      surfaceWaveSpeed: this.surfaceWaveSpeed,
      reflections: [...this.reflections],
      refractions: [...this.refractions],
    };
  }

  private updateBoundaryInteractions(pWaveRadius: number): void {
    const { x, y, z } = this.hypocenter;

    for (const layer of GEOLOGIC_LAYERS) {
      const distances = [
        Math.abs(y - layer.yMin),
        Math.abs(y - layer.yMax),
      ];

      for (let i = 0; i < distances.length; i++) {
        const boundaryY = i === 0 ? layer.yMin : layer.yMax;
        const key = `${boundaryY}-${i}`;

        if (pWaveRadius >= distances[i] && !this.processedBoundaries.has(key)) {
          this.processedBoundaries.add(key);

          const ratio = (y - boundaryY) / pWaveRadius;
          const angle = Math.asin(Math.max(-1, Math.min(1, ratio))) * (180 / Math.PI);
          const refractionAngle = angle + (15 + Math.random() * 15);

          const intersectionPoint: [number, number, number] = [
            x + Math.cos(angle * (Math.PI / 180)) * pWaveRadius * 0.3,
            boundaryY,
            z + Math.sin(angle * (Math.PI / 180)) * pWaveRadius * 0.3,
          ];

          if (this.reflections.length < MAX_REFLECTIONS) {
            this.reflections.push({
              position: intersectionPoint,
              normal: [0, y > boundaryY ? 1 : -1, 0],
              time: pWaveRadius / this.pWaveSpeed,
            });
          }

          if (this.refractions.length < MAX_REFRACTIONS) {
            const refractDirY = y > boundaryY ? -1 : 1;
            this.refractions.push({
              position: intersectionPoint,
              direction: [
                Math.cos(refractionAngle * (Math.PI / 180)) * 0.5,
                refractDirY,
                Math.sin(refractionAngle * (Math.PI / 180)) * 0.5,
              ],
              angle: refractionAngle,
              time: pWaveRadius / this.pWaveSpeed,
            });
          }
        }
      }
    }
  }

  getTopographyHeight(x: number, z: number, time: number): number {
    const clampedTime = Math.max(0, Math.min(time, ANIMATION_DURATION));
    const distFromHypo = Math.sqrt(
      Math.pow(x - this.hypocenter.x, 2) + Math.pow(z - this.hypocenter.z, 2)
    );
    const waveRadius = this.surfaceWaveSpeed * clampedTime;
    const waveWidth = 1.5;

    const distFromWave = Math.abs(distFromHypo - waveRadius);
    if (distFromWave > waveWidth) return 0;

    const amplitude = 0.1 * (1 - distFromWave / waveWidth);
    const phase = (distFromHypo - waveRadius) * 3;
    return amplitude * Math.sin(phase) * Math.exp(-distFromWave * 2);
  }
}

export function createWaveSimulator(
  hypocenter: Hypocenter,
  elasticity: number,
  density: number
): WaveSimulator {
  return new WaveSimulator(hypocenter, elasticity, density);
}
