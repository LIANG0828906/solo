import * as THREE from 'three';
import type { GalaxyType } from '../utils/colorPalette';
import {
  getSpiralCoreColor,
  getSpiralArmColor,
  getEllipticalColor,
  getIrregularColor,
  getStarBrightness,
  getStarSize
} from '../utils/colorPalette';

export interface GalaxyParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  basePositions: Float32Array;
  initialAngles: Float32Array;
  distances: Float32Array;
  radialSpeeds: Float32Array;
  armIndices: Float32Array;
  clusterIDs: Float32Array;
  count: number;
  maxRadius: number;
}

export interface GalaxyParams {
  type: GalaxyType;
  densityMultiplier: number;
  evolutionTime: number;
}

const BASE_COUNTS: Record<GalaxyType, number> = {
  spiral: 60000,
  elliptical: 50000,
  irregular: 40000
};

const MAX_RADIUS = 15;

const gaussianRandom = (): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999.1) * 43758.5453;
  return x - Math.floor(x);
};

const generateSpiral = (count: number, evolutionTime: number): GalaxyParticleData => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const basePositions = new Float32Array(count * 3);
  const initialAngles = new Float32Array(count);
  const distances = new Float32Array(count);
  const radialSpeeds = new Float32Array(count);
  const armIndices = new Float32Array(count);
  const clusterIDs = new Float32Array(count);

  const numArms = 4;
  const armSeparation = (Math.PI * 2) / numArms;
  const armOffset = evolutionTime * 0.008;
  const tightness = 0.32 + evolutionTime * 0.0015;
  const coreRadius = MAX_RADIUS * 0.12;
  const coreRatio = 0.18;
  const coreCount = Math.floor(count * coreRatio);
  const armCount = count - coreCount;

  for (let i = 0; i < coreCount; i++) {
    const r = Math.pow(Math.random(), 0.5) * coreRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1) * 0.4;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    const dist = Math.sqrt(x * x + y * y + z * z);
    const color = getSpiralCoreColor(dist, MAX_RADIUS);
    const size = getStarSize(dist, MAX_RADIUS, 0.09);
    const brightness = getStarBrightness(dist, MAX_RADIUS);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    colors[i * 3] = color.r * brightness;
    colors[i * 3 + 1] = color.g * brightness;
    colors[i * 3 + 2] = color.b * brightness;

    sizes[i] = size;
    initialAngles[i] = theta;
    distances[i] = dist;
    radialSpeeds[i] = 0.8 + (1 - dist / MAX_RADIUS) * 1.2;
    armIndices[i] = -1;
    clusterIDs[i] = -1;
  }

  for (let i = 0; i < armCount; i++) {
    const idx = coreCount + i;
    const armIndex = i % numArms;
    const t = Math.pow(Math.random(), 0.7);
    const r = coreRadius + t * (MAX_RADIUS - coreRadius);

    const armT = (r / MAX_RADIUS) * 5;
    const baseAngle = armIndex * armSeparation + armT * tightness + armOffset;

    const spreadFactor = 0.35 + t * 0.4;
    const spread = (gaussianRandom() * spreadFactor) * (0.3 + t * 0.8);
    const angle = baseAngle + spread;

    const verticalSpread = (gaussianRandom() * 0.08) * (0.4 + t * 0.8);

    const x = r * Math.cos(angle);
    const y = verticalSpread * MAX_RADIUS * 0.3;
    const z = r * Math.sin(angle);

    const dist = Math.sqrt(x * x + y * y + z * z);

    const armMix = Math.min(t * 1.5, 1);
    const armColorT = (seededRandom(i * 3.14 + armIndex) + armIndex / numArms) % 1;
    const armColor = getSpiralArmColor(armColorT);
    const coreColor = getSpiralCoreColor(dist, MAX_RADIUS);

    const finalColor = new THREE.Color();
    finalColor.r = coreColor.r * (1 - armMix) + armColor.r * armMix;
    finalColor.g = coreColor.g * (1 - armMix) + armColor.g * armMix;
    finalColor.b = coreColor.b * (1 - armMix) + armColor.b * armMix;

    const brightness = getStarBrightness(dist, MAX_RADIUS) * (0.85 + armMix * 0.25);
    const size = getStarSize(dist, MAX_RADIUS, 0.065);

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    basePositions[idx * 3] = x;
    basePositions[idx * 3 + 1] = y;
    basePositions[idx * 3 + 2] = z;

    colors[idx * 3] = finalColor.r * brightness;
    colors[idx * 3 + 1] = finalColor.g * brightness;
    colors[idx * 3 + 2] = finalColor.b * brightness;

    sizes[idx] = size;
    initialAngles[idx] = angle;
    distances[idx] = dist;
    radialSpeeds[idx] = 0.5 + (1 - t) * 1.5;
    armIndices[idx] = armIndex;
    clusterIDs[idx] = -1;
  }

  return {
    positions,
    colors,
    sizes,
    basePositions,
    initialAngles,
    distances,
    radialSpeeds,
    armIndices,
    clusterIDs,
    count,
    maxRadius: MAX_RADIUS
  };
};

const generateElliptical = (count: number, evolutionTime: number): GalaxyParticleData => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const basePositions = new Float32Array(count * 3);
  const initialAngles = new Float32Array(count);
  const distances = new Float32Array(count);
  const radialSpeeds = new Float32Array(count);
  const armIndices = new Float32Array(count);
  const clusterIDs = new Float32Array(count);

  const a = MAX_RADIUS;
  const b = MAX_RADIUS * 0.75;
  const c = MAX_RADIUS * 0.55;

  const elongFactor = 1 + evolutionTime * 0.002;

  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number;
    let attempts = 0;

    do {
      x = gaussianRandom() * 0.5 * a * elongFactor;
      y = gaussianRandom() * 0.5 * b;
      z = gaussianRandom() * 0.5 * c;
      attempts++;
    } while (
      (x * x) / (a * a) + (y * y) / (b * b) + (z * z) / (c * c) > 1 &&
      attempts < 20
    );

    const scale =
      Math.min(
        1,
        1 /
          Math.sqrt(
            (x * x) / (a * a) + (y * y) / (b * b) + (z * z) / (c * c) + 0.0001
          )
      );
    x *= scale;
    y *= scale;
    z *= scale;

    const dist = Math.sqrt(x * x + y * y + z * z);
    const color = getEllipticalColor(dist, MAX_RADIUS);
    const brightness = getStarBrightness(dist, MAX_RADIUS);
    const size = getStarSize(dist, MAX_RADIUS, 0.06);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    colors[i * 3] = color.r * brightness;
    colors[i * 3 + 1] = color.g * brightness;
    colors[i * 3 + 2] = color.b * brightness;

    sizes[i] = size;
    initialAngles[i] = Math.atan2(z, x);
    distances[i] = dist;
    radialSpeeds[i] = 0.3 + (1 - dist / MAX_RADIUS) * 0.8;
    armIndices[i] = -1;
    clusterIDs[i] = -1;
  }

  return {
    positions,
    colors,
    sizes,
    basePositions,
    initialAngles,
    distances,
    radialSpeeds,
    armIndices,
    clusterIDs,
    count,
    maxRadius: MAX_RADIUS
  };
};

const generateIrregular = (count: number, evolutionTime: number): GalaxyParticleData => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const basePositions = new Float32Array(count * 3);
  const initialAngles = new Float32Array(count);
  const distances = new Float32Array(count);
  const radialSpeeds = new Float32Array(count);
  const armIndices = new Float32Array(count);
  const clusterIDs = new Float32Array(count);

  const numClusters = 6 + Math.floor(evolutionTime * 0.03);
  const clusters: { x: number; y: number; z: number; radius: number; strength: number }[] = [];

  for (let c = 0; c < numClusters; c++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * MAX_RADIUS * 0.6;

    clusters.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi) * 0.6,
      z: r * Math.sin(phi) * Math.sin(theta),
      radius: 1.5 + Math.random() * 3,
      strength: 0.5 + Math.random() * 0.5
    });
  }

  const clusterRatio = 0.55;
  const clusterCount = Math.floor(count * clusterRatio);
  const scatteredCount = count - clusterCount;

  for (let i = 0; i < clusterCount; i++) {
    const clusterIdx = i % numClusters;
    const cluster = clusters[clusterIdx];

    const t = Math.pow(Math.random(), 0.6);
    const r = t * cluster.radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const drift = evolutionTime * 0.003;
    const x = cluster.x + r * Math.sin(phi) * Math.cos(theta) + gaussianRandom() * drift;
    const y = cluster.y + r * Math.cos(phi) * 0.7 + gaussianRandom() * drift;
    const z = cluster.z + r * Math.sin(phi) * Math.sin(theta) + gaussianRandom() * drift;

    const dist = Math.sqrt(x * x + y * y + z * z);
    const color = getIrregularColor(seededRandom(i * 7.7 + clusterIdx), clusterIdx / numClusters);
    const brightness = 0.6 + cluster.strength * 0.5;
    const size = 0.045 + cluster.strength * 0.035 + (1 - t) * 0.02;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    colors[i * 3] = color.r * brightness;
    colors[i * 3 + 1] = color.g * brightness;
    colors[i * 3 + 2] = color.b * brightness;

    sizes[i] = size;
    initialAngles[i] = Math.atan2(z, x);
    distances[i] = dist;
    radialSpeeds[i] = 0.2 + cluster.strength * 0.4;
    armIndices[i] = -1;
    clusterIDs[i] = clusterIdx;
  }

  for (let i = 0; i < scatteredCount; i++) {
    const idx = clusterCount + i;

    const r = Math.pow(Math.random(), 0.5) * MAX_RADIUS;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta) + gaussianRandom() * evolutionTime * 0.004;
    const y = r * Math.cos(phi) * 0.7;
    const z = r * Math.sin(phi) * Math.sin(theta) + gaussianRandom() * evolutionTime * 0.004;

    const dist = Math.sqrt(x * x + y * y + z * z);
    const color = getIrregularColor(seededRandom(i * 13.3), 0.5);
    const brightness = getStarBrightness(dist, MAX_RADIUS) * 0.85;
    const size = getStarSize(dist, MAX_RADIUS, 0.04);

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    basePositions[idx * 3] = x;
    basePositions[idx * 3 + 1] = y;
    basePositions[idx * 3 + 2] = z;

    colors[idx * 3] = color.r * brightness;
    colors[idx * 3 + 1] = color.g * brightness;
    colors[idx * 3 + 2] = color.b * brightness;

    sizes[idx] = size;
    initialAngles[idx] = theta;
    distances[idx] = dist;
    radialSpeeds[idx] = 0.1 + (1 - dist / MAX_RADIUS) * 0.5;
    armIndices[idx] = -1;
    clusterIDs[idx] = -1;
  }

  return {
    positions,
    colors,
    sizes,
    basePositions,
    initialAngles,
    distances,
    radialSpeeds,
    armIndices,
    clusterIDs,
    count,
    maxRadius: MAX_RADIUS
  };
};

export const generateGalaxy = (params: GalaxyParams): GalaxyParticleData => {
  const baseCount = BASE_COUNTS[params.type];
  const count = Math.floor(baseCount * params.densityMultiplier);

  switch (params.type) {
    case 'spiral':
      return generateSpiral(count, params.evolutionTime);
    case 'elliptical':
      return generateElliptical(count, params.evolutionTime);
    case 'irregular':
      return generateIrregular(count, params.evolutionTime);
    default:
      return generateSpiral(count, params.evolutionTime);
  }
};
