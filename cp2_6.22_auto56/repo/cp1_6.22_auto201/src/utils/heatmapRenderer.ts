import * as THREE from 'three';
import { HeatmapPoint } from './dataProcessor';

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  opacities: Float32Array;
  basePositions: Float32Array;
  pointData: HeatmapPoint[];
}

const MAP_CENTER = { lat: 40.0, lng: 116.4 };
const SCALE_FACTOR = 500;

export function latLngToPosition(lat: number, lng: number): [number, number, number] {
  const x = (lng - MAP_CENTER.lng) * SCALE_FACTOR;
  const z = (MAP_CENTER.lat - lat) * SCALE_FACTOR;
  const y = 2;
  return [x, y, z];
}

function getHeatColor(intensity: number): THREE.Color {
  const color = new THREE.Color();
  if (intensity < 0.5) {
    const t = intensity * 2;
    color.setRGB(0, 1, t);
  } else {
    const t = (intensity - 0.5) * 2;
    color.setRGB(t, 1 - t, 0);
  }
  return color;
}

export function createParticleData(heatmapData: HeatmapPoint[]): ParticleData {
  const count = Math.min(heatmapData.length, 3000);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const basePositions = new Float32Array(count * 3);
  const pointData: HeatmapPoint[] = [];

  for (let i = 0; i < count; i++) {
    const point = heatmapData[i];
    const [x, y, z] = latLngToPosition(point.lat, point.lng);
    const color = getHeatColor(point.intensity);
    const size = 0.5 + point.intensity * 2.5;
    const opacity = 0.3 + point.intensity * 0.6;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = size;
    opacities[i] = opacity;
    pointData.push(point);
  }

  return { positions, colors, sizes, opacities, basePositions, pointData };
}

export function updateParticleAnimation(
  particleData: ParticleData,
  time: number
): Float32Array {
  const positions = particleData.positions;
  const basePositions = particleData.basePositions;
  const count = positions.length / 3;
  const frequency = 1;
  const amplitude = 0.1;

  for (let i = 0; i < count; i++) {
    const phase = i * 0.1;
    const offsetY = Math.sin(time * frequency * Math.PI * 2 + phase) * amplitude;
    positions[i * 3 + 1] = basePositions[i * 3 + 1] + offsetY + 1.5 + particleData.pointData[i].intensity * 3;
  }

  return positions;
}

export function updateParticleIntensity(
  particleData: ParticleData,
  heatmapData: HeatmapPoint[]
): ParticleData {
  const newData = createParticleData(heatmapData);
  return newData;
}

export function getPointFromIndex(
  particleData: ParticleData,
  index: number
): HeatmapPoint | null {
  if (index >= 0 && index < particleData.pointData.length) {
    return particleData.pointData[index];
  }
  return null;
}

export function createParticleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;
  
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
