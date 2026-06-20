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

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

const lerpColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const clampedT = Math.max(0, Math.min(1, t));
  const r = Math.round((c1.r + (c2.r - c1.r) * clampedT) * 255);
  const g = Math.round((c1.g + (c2.g - c1.g) * clampedT) * 255);
  const b = Math.round((c1.b + (c2.b - c1.b) * clampedT) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const createStemGeometry = (
  species: PlantSpecies,
  env: EnvironmentParams,
): { geometry: THREE.BufferGeometry; materialParams: { colorTop: string; colorBottom: string } } => {
  const growth = Math.max(0.01, env.growthStage);
  const height = species.stemHeight * growth;
  const radius = species.stemRadius * (0.5 + 0.5 * growth);

  const geometry = new THREE.CylinderGeometry(radius * 0.7, radius, height, 16, 1, true);

  const positions = geometry.attributes.position;
  const colors: number[] = [];

  const bottomColor = species.colorPalette.stemBottom;
  const topColor = species.colorPalette.stemTop;

  const waterEffect = env.water / 100;
  const brownColor = '#5c4033';
  const adjustedBottomColor = lerpColor(brownColor, bottomColor, waterEffect);
  const adjustedTopColor = lerpColor(brownColor, topColor, waterEffect);

  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const normalizedY = (y + height / 2) / height;

    const color = lerpColor(adjustedBottomColor, adjustedTopColor, normalizedY);
    const rgb = hexToRgb(color);
    colors.push(rgb.r, rgb.g, rgb.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const bendAmount = (1 - env.water / 100) * 0.3;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const normalizedY = (y + height / 2) / height;
    const bend = bendAmount * normalizedY * normalizedY;
    positions.setX(i, positions.getX(i) + bend * height);
  }
  geometry.computeVertexNormals();

  return {
    geometry,
    materialParams: {
      colorTop: adjustedTopColor,
      colorBottom: adjustedBottomColor,
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

  const growth = Math.max(0.01, env.growthStage);
  const leafCount = Math.max(3, Math.floor(species.leafCount * growth));
  const lightEffect = env.light / 100;
  const stemHeight = species.stemHeight * growth;

  const yellowColor = '#c4a35a';
  const baseLeafColor = species.colorPalette.leaves;
  const leafColor = lerpColor(yellowColor, baseLeafColor, lightEffect);

  const leafAngleRange = (0.3 + 0.7 * lightEffect) * Math.PI / 2;

  for (let i = 0; i < leafCount; i++) {
    const normalizedIndex = i / Math.max(1, leafCount - 1);
    const heightOnStem = stemHeight * 0.15 + normalizedIndex * stemHeight * 0.7;

    const angle = i * species.leafSpiralTightness * Math.PI * 0.6;

    const leafWidth = species.leafSize * (0.5 + 0.5 * growth);
    const leafLength = leafWidth * 1.8;
    const leafThickness = 0.02;

    const geometry = new THREE.SphereGeometry(1, 16, 8);
    geometry.scale(leafWidth * 0.5, leafThickness, leafLength * 0.5);

    const stemRadius = species.stemRadius * (0.5 + 0.5 * growth);
    const x = Math.cos(angle) * stemRadius * 0.8;
    const z = Math.sin(angle) * stemRadius * 0.8;

    const tiltAngle = leafAngleRange * (0.5 + 0.5 * normalizedIndex);
    const side = i % 2 === 0 ? 1 : -1;

    const position = new THREE.Vector3(x, -stemHeight / 2 + heightOnStem, z);
    const rotation = new THREE.Euler(
      -tiltAngle + (1 - lightEffect) * 0.8,
      angle + side * 0.2,
      side * 0.15,
    );

    const scale = new THREE.Vector3(1, 1, 1);

    leaves.push({
      geometry,
      position,
      rotation,
      scale,
      color: leafColor,
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
  if (env.growthStage < 0.6) return null;

  const flowerScale = (env.growthStage - 0.6) / 0.4;
  const flowerSize = species.flowerSize * flowerScale;
  const stemHeight = species.stemHeight * env.growthStage;

  const petals: Array<{
    geometry: THREE.BufferGeometry;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    color: string;
  }> = [];

  for (let i = 0; i < species.petalCount; i++) {
    const angle = (i / species.petalCount) * Math.PI * 2;

    const petalLength = flowerSize * 0.6;
    const petalWidth = flowerSize * 0.25;

    const geometry = new THREE.ConeGeometry(petalWidth, petalLength, 8);
    geometry.translate(0, petalLength / 2, 0);

    const position = new THREE.Vector3(
      Math.cos(angle) * flowerSize * 0.2,
      stemHeight / 2 + flowerSize * 0.1,
      Math.sin(angle) * flowerSize * 0.2,
    );

    const rotation = new THREE.Euler(
      Math.PI / 2 - 0.4,
      angle,
      0,
    );

    const scale = new THREE.Vector3(1, 1, 1);

    petals.push({
      geometry,
      position,
      rotation,
      scale,
      color: species.colorPalette.flower,
    });
  }

  const centerGeometry = new THREE.SphereGeometry(flowerSize * 0.2, 16, 16);
  const center = {
    geometry: centerGeometry,
    position: new THREE.Vector3(0, stemHeight / 2 + flowerSize * 0.05, 0),
    scale: new THREE.Vector3(1, 1, 1),
    color: species.colorPalette.flowerCenter,
  };

  return { petals, center };
};

export const getAnimationSpeed = (temperature: number): number => {
  const normalizedTemp = (temperature - 10) / 30;
  return 0.2 + normalizedTemp * 1.8;
};
