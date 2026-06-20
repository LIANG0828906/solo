import type { WaveData, Reflection, Refraction, Hypocenter } from '@/types';
import { GEOLOGIC_LAYERS, ANIMATION_DURATION } from '@/types';

const POISSON_RATIO = 0.25;
const MAX_REFLECTIONS = 16;
const MAX_REFRACTIONS = 16;
const REFRACTION_MIN_ANGLE = 15;
const REFRACTION_MAX_ANGLE = 30;

interface LayerBoundary {
  y: number;
  densityAbove: number;
  densityBelow: number;
  nameAbove: string;
  nameBelow: string;
}

function getLayerBoundaries(): LayerBoundary[] {
  const boundaries: LayerBoundary[] = [];
  for (let i = 0; i < GEOLOGIC_LAYERS.length - 1; i++) {
    const upper = GEOLOGIC_LAYERS[i];
    const lower = GEOLOGIC_LAYERS[i + 1];
    boundaries.push({
      y: upper.yMax,
      densityAbove: upper.baseDensity,
      densityBelow: lower.baseDensity,
      nameAbove: upper.name,
      nameBelow: lower.name,
    });
  }
  return boundaries;
}

const LAYER_BOUNDARIES = getLayerBoundaries();

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

function speedInLayer(baseSpeed: number, layerDensity: number, userDensity: number): number {
  return baseSpeed * Math.sqrt(userDensity / layerDensity);
}

interface ReflectedWave {
  origin: [number, number, number];
  radius: number;
  speed: number;
  birthTime: number;
  color: string;
  isPWave: boolean;
}

interface RefractedWave {
  origin: [number, number, number];
  direction: [number, number, number];
  speed: number;
  birthTime: number;
  angle: number;
  isPWave: boolean;
}

export class WaveSimulator {
  private hypocenter: Hypocenter;
  private pWaveSpeed: number;
  private sWaveSpeed: number;
  private surfaceWaveSpeed: number;
  private userDensity: number;
  private reflections: Reflection[] = [];
  private refractions: Refraction[] = [];
  private reflectedWaves: ReflectedWave[] = [];
  private refractedWaves: RefractedWave[] = [];
  private processedBoundaries = new Set<string>();

  constructor(
    hypocenter: Hypocenter,
    elasticity: number,
    density: number
  ) {
    this.hypocenter = hypocenter;
    this.userDensity = density;
    const speeds = calculateWaveSpeeds(elasticity, density);
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
    this.userDensity = density;
    const speeds = calculateWaveSpeeds(elasticity, density);
    this.pWaveSpeed = speeds.pWaveSpeed;
    this.sWaveSpeed = speeds.sWaveSpeed;
    this.surfaceWaveSpeed = speeds.surfaceWaveSpeed;
    this.reset();
  }

  reset(): void {
    this.reflections = [];
    this.refractions = [];
    this.reflectedWaves = [];
    this.refractedWaves = [];
    this.processedBoundaries.clear();
  }

  getWaveData(time: number): WaveData {
    const clampedTime = Math.max(0, Math.min(time, ANIMATION_DURATION));

    const pWaveRadius = this.pWaveSpeed * clampedTime;
    const sWaveRadius = this.sWaveSpeed * clampedTime;
    const surfaceWaveRadius = this.surfaceWaveSpeed * clampedTime;

    this.detectBoundaryInteractions(pWaveRadius, sWaveRadius, clampedTime);

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

  private detectBoundaryInteractions(
    pWaveRadius: number,
    sWaveRadius: number,
    currentTime: number
  ): void {
    const { y } = this.hypocenter;

    for (const boundary of LAYER_BOUNDARIES) {
      const distToBoundary = Math.abs(y - boundary.y);

      this.processWaveBoundary(
        pWaveRadius, distToBoundary, boundary, currentTime, true
      );
      this.processWaveBoundary(
        sWaveRadius, distToBoundary, boundary, currentTime, false
      );
    }
  }

  private processWaveBoundary(
    waveRadius: number,
    distToBoundary: number,
    boundary: LayerBoundary,
    _currentTime: number,
    isPWave: boolean
  ): void {
    const waveType = isPWave ? 'P' : 'S';
    const key = `${boundary.y}-${waveType}`;

    if (waveRadius >= distToBoundary && !this.processedBoundaries.has(key)) {
      this.processedBoundaries.add(key);

      const densityRatio = boundary.densityBelow / boundary.densityAbove;
      const sinIncidence = distToBoundary / Math.max(waveRadius, 0.001);
      const incidenceAngle = Math.asin(Math.min(1, sinIncidence));

      const isEnteringDenser = boundary.densityBelow > boundary.densityAbove;
      let refractionAngle: number;

      if (isEnteringDenser) {
        refractionAngle = incidenceAngle * (1 / densityRatio);
      } else {
        const sinRefracted = Math.sin(incidenceAngle) * densityRatio;
        if (sinRefracted >= 1) {
          refractionAngle = Math.PI / 2;
        } else {
          refractionAngle = Math.asin(sinRefracted);
        }
      }

      const refractionDeviation =
        (REFRACTION_MIN_ANGLE + Math.random() * (REFRACTION_MAX_ANGLE - REFRACTION_MIN_ANGLE)) *
        (Math.PI / 180);
      refractionAngle = Math.max(refractionAngle, refractionDeviation);

      const birthTime = distToBoundary / (isPWave ? this.pWaveSpeed : this.sWaveSpeed);

      const { x, z } = this.hypocenter;
      const horizontalDist = Math.sqrt(
        Math.max(0, waveRadius * waveRadius - distToBoundary * distToBoundary)
      );

      const numHits = Math.max(1, Math.floor(horizontalDist / 2));
      for (let i = 0; i < numHits && this.reflections.length < MAX_REFLECTIONS; i++) {
        const angle = (2 * Math.PI * i) / numHits;
        const hitX = x + Math.cos(angle) * horizontalDist * 0.6;
        const hitZ = z + Math.sin(angle) * horizontalDist * 0.6;

        this.reflections.push({
          position: [hitX, boundary.y, hitZ],
          normal: [0, this.hypocenter.y > boundary.y ? 1 : -1, 0],
          time: birthTime,
        });
      }

      for (let i = 0; i < Math.min(numHits, 2) && this.refractions.length < MAX_REFRACTIONS; i++) {
        const angle = (2 * Math.PI * i) / Math.max(numHits, 1);
        const hitX = x + Math.cos(angle) * horizontalDist * 0.6;
        const hitZ = z + Math.sin(angle) * horizontalDist * 0.6;

        const downward = this.hypocenter.y > boundary.y ? -1 : 1;
        const dirX = Math.cos(angle) * Math.sin(refractionAngle);
        const dirY = downward * Math.cos(refractionAngle);
        const dirZ = Math.sin(angle) * Math.sin(refractionAngle);

        const refractedSpeed = isPWave
          ? speedInLayer(this.pWaveSpeed, boundary.densityBelow, this.userDensity)
          : speedInLayer(this.sWaveSpeed, boundary.densityBelow, this.userDensity);

        this.refractions.push({
          position: [hitX, boundary.y, hitZ],
          direction: [dirX, dirY, dirZ],
          angle: refractionAngle * (180 / Math.PI),
          time: birthTime,
        });

        if (this.refractedWaves.length < 8) {
          this.refractedWaves.push({
            origin: [hitX, boundary.y, hitZ],
            direction: [dirX, dirY, dirZ],
            speed: refractedSpeed,
            birthTime,
            angle: refractionAngle * (180 / Math.PI),
            isPWave,
          });
        }
      }

      if (this.reflectedWaves.length < 8) {
        const reflSpeed = isPWave ? this.pWaveSpeed : this.sWaveSpeed;
        this.reflectedWaves.push({
          origin: [x, boundary.y, z],
          radius: 0,
          speed: reflSpeed * 0.8,
          birthTime,
          color: isPWave ? '#4fc3f7' : '#81c784',
          isPWave,
        });
      }
    }
  }

  getReflectedWaveData(time: number): Array<{
    origin: [number, number, number];
    radius: number;
    color: string;
    isPWave: boolean;
  }> {
    return this.reflectedWaves
      .filter((w) => time >= w.birthTime)
      .map((w) => ({
        origin: w.origin,
        radius: (time - w.birthTime) * w.speed,
        color: w.color,
        isPWave: w.isPWave,
      }));
  }

  getRefractedWaveData(time: number): Array<{
    origin: [number, number, number];
    direction: [number, number, number];
    length: number;
    isPWave: boolean;
  }> {
    return this.refractedWaves
      .filter((w) => time >= w.birthTime)
      .map((w) => ({
        origin: w.origin,
        direction: w.direction,
        length: (time - w.birthTime) * w.speed,
        isPWave: w.isPWave,
      }));
  }

  getTopographyHeight(x: number, z: number, time: number): number {
    const clampedTime = Math.max(0, Math.min(time, ANIMATION_DURATION));
    const distFromHypo = Math.sqrt(
      (x - this.hypocenter.x) ** 2 + (z - this.hypocenter.z) ** 2
    );
    const waveRadius = this.surfaceWaveSpeed * clampedTime;
    const waveWidth = 2.0;

    if (waveRadius <= 0) return 0;

    const distFromWave = Math.abs(distFromHypo - waveRadius);
    if (distFromWave > waveWidth) return 0;

    const proximity = 1 - distFromWave / waveWidth;
    const amplitude = 0.3 * proximity * Math.exp(-distFromWave * 1.5);
    const phase = (distFromHypo - waveRadius) * 4;
    return amplitude * Math.sin(phase);
  }
}

export function createWaveSimulator(
  hypocenter: Hypocenter,
  elasticity: number,
  density: number
): WaveSimulator {
  return new WaveSimulator(hypocenter, elasticity, density);
}
