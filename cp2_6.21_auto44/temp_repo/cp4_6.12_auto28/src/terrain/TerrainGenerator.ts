import * as THREE from 'three';
import { PerlinNoise } from '../utils/PerlinNoise';

export interface TerrainData {
  size: number;
  heightScale: number;
  frequency: number;
  seed: number;
  heights: Float32Array;
  geometry: THREE.BufferGeometry;
  minHeight: number;
  maxHeight: number;
}

export interface TerrainParams {
  size: number;
  heightScale: number;
  frequency: number;
  seed: number;
}

export class TerrainGenerator {
  private noise: PerlinNoise;

  constructor(seed: number = 0) {
    this.noise = new PerlinNoise(seed);
  }

  public generate(params: TerrainParams): TerrainData {
    const { size, heightScale, frequency, seed } = params;

    this.noise.reseed(seed);

    const heights = new Float32Array((size + 1) * (size + 1));
    let minHeight = Infinity;
    let maxHeight = -Infinity;

    for (let j = 0; j <= size; j++) {
      for (let i = 0; i <= size; i++) {
        const idx = j * (size + 1) + i;
        const x = i * frequency;
        const y = j * frequency;

        const noiseValue = this.noise.fbm2D(x, y, 6, 0.5, 2.0);
        const normalizedHeight = (noiseValue + 1) * 0.5;
        const height = normalizedHeight * heightScale;

        heights[idx] = height;

        if (height < minHeight) minHeight = height;
        if (height > maxHeight) maxHeight = height;
      }
    }

    const geometry = this.createGeometry(size, heights, heightScale);

    return {
      size,
      heightScale,
      frequency,
      seed,
      heights,
      geometry,
      minHeight,
      maxHeight
    };
  }

  private createGeometry(size: number, heights: Float32Array, heightScale: number): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(size, size, size, size);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;

    for (let j = 0; j <= size; j++) {
      for (let i = 0; i <= size; i++) {
        const idx = j * (size + 1) + i;
        const height = heights[idx];
        positions.setY(idx, height);
      }
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }

  public getHeightAt(data: TerrainData, worldX: number, worldZ: number): number {
    const halfSize = data.size / 2;
    const localX = worldX + halfSize;
    const localZ = worldZ + halfSize;

    if (localX < 0 || localX > data.size || localZ < 0 || localZ > data.size) {
      return 0;
    }

    const x0 = Math.floor(localX);
    const z0 = Math.floor(localZ);
    const x1 = Math.min(x0 + 1, data.size);
    const z1 = Math.min(z0 + 1, data.size);

    const fx = localX - x0;
    const fz = localZ - z0;

    const h00 = data.heights[z0 * (data.size + 1) + x0];
    const h10 = data.heights[z0 * (data.size + 1) + x1];
    const h01 = data.heights[z1 * (data.size + 1) + x0];
    const h11 = data.heights[z1 * (data.size + 1) + x1];

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  }
}
