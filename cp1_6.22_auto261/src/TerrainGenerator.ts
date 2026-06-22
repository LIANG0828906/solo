import * as THREE from 'three';
import { COLORS } from './OceanConfig';

class PerlinNoise {
  private perm: number[];

  constructor(seed: number) {
    this.perm = this.generatePermutation(seed);
  }

  private generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
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
    return (h & 1) === 0 ? u : -u + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;
    return this.lerp(
      this.lerp(this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y), u),
      this.lerp(this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1), u),
      v
    );
  }

  octaveNoise(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }
}

function lerpColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function getTerrainColor(height: number): { r: number; g: number; b: number } {
  if (height < -30) {
    return COLORS.DEEP_OCEAN;
  } else if (height < 0) {
    const t = (height + 30) / 30;
    return lerpColor(COLORS.DEEP_OCEAN, COLORS.SHALLOW_OCEAN, t);
  } else if (height < 50) {
    const t = height / 50;
    return lerpColor(COLORS.SHALLOW_OCEAN, COLORS.CONTINENTAL_SLOPE, t);
  } else {
    const t = Math.min(1, (height - 50) / 50);
    return lerpColor(COLORS.CONTINENTAL_SLOPE, COLORS.SEAMOUNT_TOP, t);
  }
}

export class TerrainGenerator {
  private size: number;
  private segments: number;
  private seed: number;
  private noise: PerlinNoise;
  private heights: Float32Array | null = null;
  private mesh: THREE.Mesh | null = null;

  constructor(config: { size: number; segments: number; seed: number }) {
    this.size = config.size;
    this.segments = config.segments;
    this.seed = config.seed;
    this.noise = new PerlinNoise(config.seed);
  }

  generate(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors: number[] = [];
    const heights = new Float32Array((this.segments + 1) * (this.segments + 1));
    this.heights = heights;

    const halfSize = this.size / 2;
    const step = this.size / this.segments;

    for (let i = 0; i <= this.segments; i++) {
      for (let j = 0; j <= this.segments; j++) {
        const x = -halfSize + j * step;
        const z = -halfSize + i * step;
        const idx = i * (this.segments + 1) + j;
        const height = this.computeHeight(x, z);
        heights[idx] = height;
        positions.setY(idx, height);

        const color = getTerrainColor(height);
        colors.push(color.r, color.g, color.b);
      }
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    return this.mesh;
  }

  private computeHeight(x: number, z: number): number {
    const nx = (x + this.size / 2) / this.size;
    const nz = (z + this.size / 2) / this.size;

    let height = this.noise.octaveNoise(nx * 3, nz * 3, 5, 0.5) * 40;

    const trenchX = 0.35;
    const trenchZ = 0.5;
    const trenchDist = Math.sqrt((nx - trenchX) ** 2 + (nz - trenchZ) ** 2);
    const trenchWidth = 0.15;
    if (trenchDist < trenchWidth) {
      const trenchFactor = 1 - trenchDist / trenchWidth;
      height -= trenchFactor * trenchFactor * 80;
    }

    const seamountX = 0.7;
    const seamountZ = 0.4;
    const seamountDist = Math.sqrt((nx - seamountX) ** 2 + (nz - seamountZ) ** 2);
    const seamountWidth = 0.2;
    if (seamountDist < seamountWidth) {
      const seamountFactor = 1 - seamountDist / seamountWidth;
      height += seamountFactor * seamountFactor * 130;
    }

    height -= 20;

    return height;
  }

  getHeightAt(x: number, z: number): number {
    if (!this.heights) return 0;
    const halfSize = this.size / 2;
    if (x < -halfSize || x > halfSize || z < -halfSize || z > halfSize) {
      return 0;
    }
    const step = this.size / this.segments;
    const fx = (x + halfSize) / step;
    const fz = (z + halfSize) / step;
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const ix1 = Math.min(ix, this.segments);
    const iz1 = Math.min(iz, this.segments);
    const ix2 = Math.min(ix + 1, this.segments);
    const iz2 = Math.min(iz + 1, this.segments);
    const h00 = this.heights[iz1 * (this.segments + 1) + ix1];
    const h10 = this.heights[iz1 * (this.segments + 1) + ix2];
    const h01 = this.heights[iz2 * (this.segments + 1) + ix1];
    const h11 = this.heights[iz2 * (this.segments + 1) + ix2];
    const hx0 = h00 + (h10 - h00) * tx;
    const hx1 = h01 + (h11 - h01) * tx;
    return hx0 + (hx1 - hx0) * tz;
  }

  getSlopeAt(x: number, z: number): number {
    const eps = 0.5;
    const hL = this.getHeightAt(x - eps, z);
    const hR = this.getHeightAt(x + eps, z);
    const hD = this.getHeightAt(x, z - eps);
    const hU = this.getHeightAt(x, z + eps);
    const dx = (hR - hL) / (2 * eps);
    const dz = (hU - hD) / (2 * eps);
    return Math.sqrt(dx * dx + dz * dz);
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  dispose(): void {
    if (this.mesh?.geometry) this.mesh.geometry.dispose();
    if (this.mesh?.material) {
      const mats = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material];
      mats.forEach((m) => m.dispose());
    }
  }
}
