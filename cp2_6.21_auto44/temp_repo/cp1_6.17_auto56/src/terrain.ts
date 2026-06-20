import * as THREE from 'three';

export type TerrainMode = 'noise' | 'ridge';

export interface TerrainParams {
  resolution: number;
  heightScale: number;
  noiseFrequency: number;
  mode: TerrainMode;
}

const DEFAULT_PARAMS: TerrainParams = {
  resolution: 256,
  heightScale: 1.0,
  noiseFrequency: 0.03,
  mode: 'noise',
};

const TERRAIN_SIZE = 500;
const LOW_COLOR = new THREE.Color(0x4CAF50);
const HIGH_COLOR = new THREE.Color(0x8D6E63);

class PerlinNoise {
  private permutation: number[];

  constructor(seed: number = Math.random() * 10000) {
    this.permutation = this.generatePermutation(seed);
  }

  private generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    let n: number;
    let q: number;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      n = seed % (i + 1);
      q = p[i];
      p[i] = p[n];
      p[n] = q;
    }
    return [...p, ...p];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.permutation[X] + Y;
    const B = this.permutation[X + 1] + Y;
    return this.lerp(
      this.lerp(this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y), u),
      this.lerp(this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1), u),
      v
    );
  }

  fbm(x: number, y: number, octaves: number = 6): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / maxValue;
  }
}

export class Terrain {
  public mesh: THREE.Mesh;
  public params: TerrainParams;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshStandardMaterial;
  private noise: PerlinNoise;
  private heightmap: Float32Array;
  private transitionTarget: Float32Array | null = null;
  private transitionStart: Float32Array | null = null;
  private transitionTime: number = 0;
  private transitionDuration: number = 0;
  private isTransitioning: boolean = false;

  constructor() {
    this.params = { ...DEFAULT_PARAMS };
    this.noise = new PerlinNoise(42);
    this.geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, this.params.resolution - 1, this.params.resolution - 1);
    this.geometry.rotateX(-Math.PI / 2);
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.heightmap = new Float32Array(this.params.resolution * this.params.resolution);
    this.generateHeightmap();
    this.updateGeometry();
  }

  private generateHeightmap(): void {
    const { resolution, noiseFrequency, mode } = this.params;
    const size = resolution * resolution;
    if (this.heightmap.length !== size) {
      this.heightmap = new Float32Array(size);
    }
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const idx = y * resolution + x;
        const nx = x * noiseFrequency;
        const ny = y * noiseFrequency;
        if (mode === 'noise') {
          this.heightmap[idx] = (this.noise.fbm(nx, ny, 6) + 1) / 2;
        } else {
          let value = 0;
          let amplitude = 1;
          let frequency = 1;
          let maxValue = 0;
          for (let i = 0; i < 6; i++) {
            const noiseVal = Math.abs(this.noise.noise2D(nx * frequency, ny * frequency));
            value += noiseVal * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
          }
          this.heightmap[idx] = 1 - value / maxValue;
        }
      }
    }
  }

  private updateGeometry(): void {
    const { resolution, heightScale } = this.params;
    const positions = this.geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    let maxHeight = 0;
    let minHeight = Infinity;
    for (let i = 0; i < positions.count; i++) {
      const x = Math.floor((i % resolution));
      const y = Math.floor(i / resolution);
      const idx = y * resolution + x;
      const height = this.heightmap[idx] * heightScale * 100;
      positions.setY(i, height);
      if (height > maxHeight) maxHeight = height;
      if (height < minHeight) minHeight = height;
    }
    const heightRange = maxHeight - minHeight || 1;
    for (let i = 0; i < positions.count; i++) {
      const height = positions.getY(i);
      const t = (height - minHeight) / heightRange;
      const color = LOW_COLOR.clone().lerp(HIGH_COLOR, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private rebuildGeometry(): void {
    this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, this.params.resolution - 1, this.params.resolution - 1);
    this.geometry.rotateX(-Math.PI / 2);
    this.mesh.geometry = this.geometry;
    this.heightmap = new Float32Array(this.params.resolution * this.params.resolution);
    this.generateHeightmap();
    this.updateGeometry();
  }

  public setHeightScale(value: number): void {
    this.params.heightScale = value;
    this.updateGeometry();
  }

  public setNoiseFrequency(value: number): void {
    this.params.noiseFrequency = value;
    this.generateHeightmap();
    this.updateGeometry();
  }

  public setResolution(value: number): void {
    this.params.resolution = value;
    this.rebuildGeometry();
  }

  public setMode(mode: TerrainMode): void {
    if (mode === this.params.mode) return;
    this.params.mode = mode;
    const oldHeightmap = new Float32Array(this.heightmap);
    this.generateHeightmap();
    const newHeightmap = new Float32Array(this.heightmap);
    this.startTransition(oldHeightmap, newHeightmap, 300);
  }

  private startTransition(from: Float32Array, to: Float32Array, duration: number): void {
    this.transitionStart = from;
    this.transitionTarget = to;
    this.transitionDuration = duration;
    this.transitionTime = 0;
    this.isTransitioning = true;
  }

  public update(deltaTime: number): void {
    if (!this.isTransitioning || !this.transitionStart || !this.transitionTarget) return;
    this.transitionTime += deltaTime * 1000;
    const t = Math.min(this.transitionTime / this.transitionDuration, 1);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    for (let i = 0; i < this.heightmap.length; i++) {
      this.heightmap[i] = this.transitionStart[i] + (this.transitionTarget[i] - this.transitionStart[i]) * easeT;
    }
    this.updateGeometry();
    if (t >= 1) {
      this.isTransitioning = false;
      this.transitionStart = null;
      this.transitionTarget = null;
    }
  }

  public reset(): void {
    this.params = { ...DEFAULT_PARAMS };
    this.rebuildGeometry();
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
