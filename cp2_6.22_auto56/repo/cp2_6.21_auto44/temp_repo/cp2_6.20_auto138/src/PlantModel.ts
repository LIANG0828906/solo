import * as THREE from 'three';
import { PlantSpecies } from './PlantData';

export interface PlantGeometry {
  stem: THREE.BufferGeometry;
  leaves: Array<{
    geometry: THREE.BufferGeometry;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    index: number;
  }>;
  flower?: {
    petals: Array<{
      geometry: THREE.BufferGeometry;
      position: THREE.Vector3;
      rotation: THREE.Euler;
      scale: THREE.Vector3;
    }>;
    center: {
      geometry: THREE.BufferGeometry;
      position: THREE.Vector3;
      scale: THREE.Vector3;
    };
  };
}

export interface EnvironmentParams {
  light: number;
  water: number;
  temperature: number;
  growthStage: number;
}

const isValidHex = (hex: string): boolean => {
  return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(hex);
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const isFiniteNumber = (value: number): boolean => {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
};

const isFiniteVector3 = (v: THREE.Vector3): boolean => {
  return isFiniteNumber(v.x) && isFiniteNumber(v.y) && isFiniteNumber(v.z);
};

const isFiniteEuler = (e: THREE.Euler): boolean => {
  return isFiniteNumber(e.x) && isFiniteNumber(e.y) && isFiniteNumber(e.z);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  if (!isValidHex(hex)) {
    console.warn(`Invalid hex color: ${hex}, falling back to #000000`);
    return { r: 0, g: 0, b: 0 };
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  if (!isFiniteNumber(r) || !isFiniteNumber(g) || !isFiniteNumber(b)) {
    return { r: 0, g: 0, b: 0 };
  }
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clampedR = Math.round(clamp(isFiniteNumber(r) ? r : 0, 0, 1) * 255);
  const clampedG = Math.round(clamp(isFiniteNumber(g) ? g : 0, 0, 1) * 255);
  const clampedB = Math.round(clamp(isFiniteNumber(b) ? b : 0, 0, 1) * 255);
  return `#${clampedR.toString(16).padStart(2, '0')}${clampedG.toString(16).padStart(2, '0')}${clampedB.toString(16).padStart(2, '0')}`;
};

const lerpColor = (color1: string, color2: string, t: number): string => {
  const clampedT = clamp(isFiniteNumber(t) ? t : 0, 0, 1);
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = c1.r + (c2.r - c1.r) * clampedT;
  const g = c1.g + (c2.g - c1.g) * clampedT;
  const b = c1.b + (c2.b - c1.b) * clampedT;
  return rgbToHex(r, g, b);
};

const saturateColor = (color: string, saturation: number): string => {
  const clampedSat = clamp(isFiniteNumber(saturation) ? saturation : 0, 0, 1);
  const rgb = hexToRgb(color);
  const gray = (rgb.r + rgb.g + rgb.b) / 3;
  const r = gray + (rgb.r - gray) * clampedSat;
  const g = gray + (rgb.g - gray) * clampedSat;
  const b = gray + (rgb.b - gray) * clampedSat;
  return rgbToHex(r, g, b);
};

const safeGrowthStage = (stage: number): number => {
  const clamped = clamp(isFiniteNumber(stage) ? stage : 0.01, 0.01, 1);
  return clamped;
};

export const createStemGeometry = (
  species: PlantSpecies,
  env: EnvironmentParams,
): { geometry: THREE.BufferGeometry; materialParams: { colorTop: string; colorBottom: string } } => {
  const growth = safeGrowthStage(env.growthStage);
  const water = clamp(isFiniteNumber(env.water) ? env.water : 50, 0, 100);
  const light = clamp(isFiniteNumber(env.light) ? env.light : 50, 0, 100);

  const height = species.stemHeight * growth;
  const baseRadius = species.stemRadius * (0.5 + 0.5 * growth);
  const waterEffect = water / 100;
  const radius = baseRadius * (0.7 + 0.3 * waterEffect);

  if (!isFiniteNumber(height) || height <= 0 || !isFiniteNumber(radius) || radius <= 0) {
    const safeHeight = species.stemHeight * 0.01;
    const safeRadius = species.stemRadius * 0.01;
    const geometry = new THREE.CylinderGeometry(safeRadius * 0.7, safeRadius, safeHeight, 16, 1, true);
    const safeColor = species.colorPalette.stemBottom;
    return {
      geometry,
      materialParams: { colorTop: safeColor, colorBottom: safeColor },
    };
  }

  const geometry = new THREE.CylinderGeometry(radius * 0.7, radius, height, 16, 1, true);

  const positions = geometry.attributes.position;
  const colors: number[] = [];

  const bottomColor = species.colorPalette.stemBottom;
  const topColor = species.colorPalette.stemTop;

  const brownColor = '#5c4033';
  const witheredColor = '#8b7355';
  const adjustedBottomColor = lerpColor(brownColor, bottomColor, waterEffect);
  const adjustedTopColor = lerpColor(witheredColor, topColor, waterEffect);

  const lightEffect = light / 100;
  const finalBottomColor = saturateColor(adjustedBottomColor, 0.5 + 0.5 * lightEffect);
  const finalTopColor = saturateColor(adjustedTopColor, 0.5 + 0.5 * lightEffect);

  const positionArray = positions.array as Float32Array;
  for (let i = 0; i < positions.count; i++) {
    const y = positionArray[i * 3 + 1];
    const normalizedY = clamp((y + height / 2) / height, 0, 1);

    const color = lerpColor(finalBottomColor, finalTopColor, normalizedY);
    const rgb = hexToRgb(color);
    colors.push(
      clamp(rgb.r, 0, 1),
      clamp(rgb.g, 0, 1),
      clamp(rgb.b, 0, 1),
    );
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const bendAmount = (1 - waterEffect) * 0.4;
  const bendDirection = Math.PI * 0.25;
  for (let i = 0; i < positions.count; i++) {
    const y = positionArray[i * 3 + 1];
    const normalizedY = clamp((y + height / 2) / height, 0, 1);
    const bendFactor = bendAmount * normalizedY * normalizedY;

    const xOffset = Math.cos(bendDirection) * bendFactor * height;
    const zOffset = Math.sin(bendDirection) * bendFactor * height * 0.5;

    positionArray[i * 3] += xOffset;
    positionArray[i * 3 + 2] += zOffset;
  }
  geometry.computeVertexNormals();

  return {
    geometry,
    materialParams: {
      colorTop: finalTopColor,
      colorBottom: finalBottomColor,
    },
  };
};

export const createLeaves = (
  species: PlantSpecies,
  env: EnvironmentParams,
): Array<{
  geometry: THREE.BufferGeometry;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  color: string;
  index: number;
}> => {
  const leaves: Array<{
    geometry: THREE.BufferGeometry;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    color: string;
    index: number;
  }> = [];

  if (species.leafCount === 0) return leaves;

  const growth = safeGrowthStage(env.growthStage);
  const light = clamp(isFiniteNumber(env.light) ? env.light : 50, 0, 100);
  const water = clamp(isFiniteNumber(env.water) ? env.water : 50, 0, 100);
  const lightEffect = light / 100;
  const waterEffect = water / 100;
  const stemHeight = species.stemHeight * growth;

  const targetLeafCount = Math.floor(species.leafCount * growth);
  const leafCount = Math.max(3, Math.min(targetLeafCount, species.leafCount));

  const yellowColor = '#c4a35a';
  const wiltedColor = '#8b7355';
  const baseLeafColor = species.colorPalette.leaves;

  const lightAdjustedColor = lerpColor(yellowColor, baseLeafColor, lightEffect);
  const waterAdjustedColor = lerpColor(wiltedColor, lightAdjustedColor, waterEffect);
  const saturation = 0.4 + 0.6 * lightEffect;
  const finalLeafColor = saturateColor(waterAdjustedColor, saturation);

  const minAngle = -0.2;
  const maxAngle = 1.2;
  const leafAngleRange = minAngle + (maxAngle - minAngle) * lightEffect;

  const stemRadius = species.stemRadius * (0.5 + 0.5 * growth) * (0.7 + 0.3 * waterEffect);

  if (leafCount <= 0 || !isFiniteNumber(stemHeight) || stemHeight <= 0) {
    return leaves;
  }

  for (let i = 0; i < leafCount; i++) {
    const denominator = Math.max(1, leafCount - 1);
    const normalizedIndex = clamp(i / denominator, 0, 1);

    const minHeight = stemHeight * 0.15;
    const maxHeight = stemHeight * 0.85;
    const heightOnStem = minHeight + normalizedIndex * (maxHeight - minHeight);

    const spiralTightness = species.leafSpiralTightness * (0.8 + 0.2 * waterEffect);
    const angle = i * spiralTightness * Math.PI * 0.6;

    const growthScale = 0.4 + 0.6 * growth;
    const waterScale = 0.7 + 0.3 * waterEffect;
    const leafWidth = species.leafSize * growthScale * waterScale;
    const leafLength = leafWidth * 1.8;
    const leafThickness = 0.02 + 0.02 * waterEffect;

    if (!isFiniteNumber(leafWidth) || leafWidth <= 0) continue;

    const geometry = new THREE.SphereGeometry(1, 16, 8);
    geometry.scale(leafWidth * 0.5, leafThickness, leafLength * 0.5);

    const leafSpacing = stemRadius * 0.9;
    const x = Math.cos(angle) * leafSpacing;
    const z = Math.sin(angle) * leafSpacing;

    const heightFactor = 0.4 + 0.6 * normalizedIndex;
    const tiltAngle = leafAngleRange * heightFactor;

    const droopAmount = (1 - lightEffect) * 0.8;
    const side = i % 2 === 0 ? 1 : -1;
    const twistAmount = side * 0.2 * (1 - waterEffect);

    const position = new THREE.Vector3(x, -stemHeight / 2 + heightOnStem, z);
    const rotation = new THREE.Euler(
      -tiltAngle + droopAmount,
      angle + side * 0.2,
      twistAmount + side * 0.1,
    );

    const sizeVariation = 0.85 + 0.3 * Math.sin(i * 0.7);
    const scale = new THREE.Vector3(sizeVariation, sizeVariation, sizeVariation);

    if (!isFiniteVector3(position) || !isFiniteEuler(rotation) || !isFiniteVector3(scale)) {
      continue;
    }

    leaves.push({
      geometry,
      position,
      rotation,
      scale,
      color: finalLeafColor,
      index: i,
    });
  }

  return leaves;
};

export const createFlower = (
  species: PlantSpecies,
  env: EnvironmentParams,
): {
  petals: Array<{
    geometry: THREE.BufferGeometry;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    color: string;
  }>;
  center: {
    geometry: THREE.BufferGeometry;
    position: THREE.Vector3;
    scale: THREE.Vector3;
    color: string;
  };
} | null => {
  if (!species.hasFlower) return null;

  const growth = safeGrowthStage(env.growthStage);
  const light = clamp(isFiniteNumber(env.light) ? env.light : 50, 0, 100);
  const water = clamp(isFiniteNumber(env.water) ? env.water : 50, 0, 100);

  if (growth < 0.6) return null;

  const flowerProgress = clamp((growth - 0.6) / 0.4, 0, 1);
  const lightEffect = light / 100;
  const waterEffect = water / 100;
  const healthFactor = (lightEffect + waterEffect) / 2;

  const flowerSize = species.flowerSize * flowerProgress * (0.8 + 0.4 * healthFactor);
  const stemHeight = species.stemHeight * growth;

  if (!isFiniteNumber(flowerSize) || flowerSize <= 0 || !isFiniteNumber(stemHeight)) {
    return null;
  }

  const petals: Array<{
    geometry: THREE.BufferGeometry;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    color: string;
  }> = [];

  const petalColor = saturateColor(species.colorPalette.flower, 0.6 + 0.4 * lightEffect);

  for (let i = 0; i < species.petalCount; i++) {
    const angle = (i / species.petalCount) * Math.PI * 2;

    const petalLength = flowerSize * 0.6 * (0.8 + 0.4 * healthFactor);
    const petalWidth = flowerSize * 0.25;

    if (!isFiniteNumber(petalLength) || petalLength <= 0) continue;

    const geometry = new THREE.ConeGeometry(petalWidth, petalLength, 8);
    geometry.translate(0, petalLength / 2, 0);

    const petalSpread = 0.2 + 0.3 * healthFactor;
    const position = new THREE.Vector3(
      Math.cos(angle) * flowerSize * petalSpread,
      stemHeight / 2 + flowerSize * 0.1,
      Math.sin(angle) * flowerSize * petalSpread,
    );

    const openness = 0.3 + 0.7 * lightEffect;
    const rotation = new THREE.Euler(
      Math.PI / 2 - (0.2 + 0.5 * openness),
      angle,
      0,
    );

    const petalVariation = 0.9 + 0.2 * Math.sin(i * 1.1);
    const scale = new THREE.Vector3(petalVariation, petalVariation, petalVariation);

    if (!isFiniteVector3(position) || !isFiniteEuler(rotation) || !isFiniteVector3(scale)) {
      continue;
    }

    petals.push({
      geometry,
      position,
      rotation,
      scale,
      color: petalColor,
    });
  }

  const centerSize = flowerSize * 0.2 * (0.9 + 0.2 * healthFactor);
  const centerGeometry = new THREE.SphereGeometry(centerSize, 16, 16);
  const centerColor = saturateColor(species.colorPalette.flowerCenter, 0.5 + 0.5 * lightEffect);
  const center = {
    geometry: centerGeometry,
    position: new THREE.Vector3(0, stemHeight / 2 + flowerSize * 0.05, 0),
    scale: new THREE.Vector3(1, 1, 1),
    color: centerColor,
  };

  return { petals, center };
};

export const getAnimationSpeed = (temperature: number): number => {
  const temp = clamp(isFiniteNumber(temperature) ? temperature : 25, 10, 40);
  const normalizedTemp = (temp - 10) / 30;
  const minSpeed = 0.15;
  const maxSpeed = 3.0;
  const speed = minSpeed + normalizedTemp * (maxSpeed - minSpeed);
  return clamp(speed, minSpeed, maxSpeed);
};
