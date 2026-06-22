import * as THREE from 'three';
import type { TileHeightMap, PresetType } from './types';

const GRID_SIZE = 20;
const LOW_COLOR = new THREE.Color(0x3a7b3a);
const MID_COLOR = new THREE.Color(0x8b6f47);
const HIGH_COLOR = new THREE.Color(0xd4c9b0);
const HEIGHT_SCALE = 5;

export function generateInitialHeightMap(size: number = GRID_SIZE): TileHeightMap {
  const heights: number[][] = [];
  const center = (size - 1) / 2;
  const maxDist = size / 2;

  for (let z = 0; z < size; z++) {
    heights[z] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dz = z - center;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const factor = Math.max(0, 1 - dist / maxDist);
      heights[z][x] = factor * factor * 1.5 + 0.2;
    }
  }

  return { size, heights };
}

export function generatePresetHeightMap(preset: PresetType, size: number = GRID_SIZE): TileHeightMap {
  const heights: number[][] = [];
  const center = (size - 1) / 2;

  for (let z = 0; z < size; z++) {
    heights[z] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dz = z - center;
      const dist = Math.sqrt(dx * dx + dz * dz);

      switch (preset) {
        case 'plain':
          heights[z][x] = 0.3 + Math.sin(x * 0.3) * 0.05 + Math.cos(z * 0.3) * 0.05;
          break;
        case 'mountain': {
          const peak1Dist = Math.sqrt((x - 6) ** 2 + (z - 6) ** 2);
          const peak2Dist = Math.sqrt((x - 14) ** 2 + (z - 13) ** 2);
          const peak3Dist = Math.sqrt((x - 10) ** 2 + (z - 16) ** 2);
          const h1 = Math.max(0, 1 - peak1Dist / 8) * 3.5;
          const h2 = Math.max(0, 1 - peak2Dist / 7) * 2.8;
          const h3 = Math.max(0, 1 - peak3Dist / 6) * 2.0;
          heights[z][x] = 0.2 + h1 + h2 + h3;
          break;
        }
        case 'basin': {
          const maxDist = size / 2;
          const factor = dist / maxDist;
          heights[z][x] = factor * factor * 2.5 + 0.1;
          break;
        }
        default:
          heights[z][x] = 0.5;
      }
    }
  }

  return { size, heights };
}

export function buildGeometry(heightMap: TileHeightMap): THREE.PlaneGeometry {
  const { size } = heightMap;
  const geometry = new THREE.PlaneGeometry(size - 1, size - 1, size - 1, size - 1);
  geometry.rotateX(-Math.PI / 2);

  updateVertexPositions(geometry, heightMap);
  updateVertexColors(geometry, heightMap);

  return geometry;
}

export function updateVertexPositions(geometry: THREE.BufferGeometry, heightMap: TileHeightMap): void {
  const positions = geometry.attributes.position;
  const { size, heights } = heightMap;

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const i = z * size + x;
      const worldX = x - (size - 1) / 2;
      const worldZ = z - (size - 1) / 2;
      positions.setXYZ(i, worldX, heights[z][x] * HEIGHT_SCALE, worldZ);
    }
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function updateVertexColors(geometry: THREE.BufferGeometry, heightMap: TileHeightMap): void {
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  const { size, heights } = heightMap;
  const minH = 0;
  const maxH = HEIGHT_SCALE * 4;

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const i = z * size + x;
      const h = heights[z][x] * HEIGHT_SCALE;
      const t = Math.max(0, Math.min(1, (h - minH) / (maxH - minH)));

      let color: THREE.Color;
      if (t < 0.5) {
        color = LOW_COLOR.clone().lerp(MID_COLOR, t * 2);
      } else {
        color = MID_COLOR.clone().lerp(HIGH_COLOR, (t - 0.5) * 2);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.attributes.color.needsUpdate = true;
}

export function smoothHeightAt(heights: number[][], x: number, z: number, strength: number): number {
  const size = heights.length;
  let sum = 0;
  let count = 0;
  const weightCenter = 1 - strength * 0.3;
  const weightNeighbor = 1;

  sum += heights[z][x] * weightCenter;
  count += weightCenter;

  const neighbors = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  for (const [dx, dz] of neighbors) {
    const nx = x + dx;
    const nz = z + dz;
    if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
      sum += heights[nz][nx] * weightNeighbor;
      count += weightNeighbor;
    }
  }

  const current = heights[z][x];
  const avg = sum / count;
  const blend = strength * 0.6;

  return current + (avg - current) * blend;
}

export function computeSlope(heights: number[][], x: number, z: number): number {
  const size = heights.length;
  if (x <= 0 || x >= size - 1 || z <= 0 || z >= size - 1) return 0;

  const h = heights[z][x] * HEIGHT_SCALE;
  const hL = heights[z][x - 1] * HEIGHT_SCALE;
  const hR = heights[z][x + 1] * HEIGHT_SCALE;
  const hU = heights[z - 1][x] * HEIGHT_SCALE;
  const hD = heights[z + 1][x] * HEIGHT_SCALE;

  const dx = (hR - hL) / 2;
  const dz = (hD - hU) / 2;
  const gradient = Math.sqrt(dx * dx + dz * dz);

  return Math.atan(gradient) * (180 / Math.PI);
}

export { HEIGHT_SCALE, GRID_SIZE };
