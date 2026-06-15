export interface TerrainParams {
  amplitude: number;
  treeDensity: number;
  waterRatio: number;
  caveComplexity: number;
  seed?: number;
}

export interface VoxelData {
  heights: number[][];
  waterLevel: number;
  size: number;
  treePositions: Array<{ x: number; z: number; y: number }>;
  caveMap: boolean[][][];
}

export class PerlinNoise {
  perm: number[];

  constructor(seed: number = Math.random() * 10000) {
    this.perm = this.generatePermutation(seed);
  }

  generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = Math.floor((s / 2147483647) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
  }

  fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;
    return this.lerp(
      this.lerp(
        this.lerp(this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z), u),
        this.lerp(this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z), u),
        v
      ),
      this.lerp(
        this.lerp(this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }

  noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0.5);
  }

  fbm2D(x: number, y: number, octaves: number = 4): number {
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

  fbm3D(x: number, y: number, z: number, octaves: number = 3): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / maxValue;
  }
}

export function generateTerrain(params: TerrainParams, size: number = 64): VoxelData {
  const seed = params.seed ?? Date.now();
  const perlin = new PerlinNoise(seed);
  const rng = mulberry32(seed);

  const heights: number[][] = [];
  const halfSize = size / 2;
  const amplitude = (params.amplitude / 100) * 24 + 4;
  const baseFrequency = 0.045;
  const waterLevel = Math.floor((params.waterRatio / 100) * amplitude * 0.7 + 2);

  const centerX = halfSize;
  const centerZ = halfSize;
  const maxDist = halfSize * Math.SQRT2;

  for (let x = 0; x < size; x++) {
    heights[x] = [];
    for (let z = 0; z < size; z++) {
      const nx = x - centerX;
      const nz = z - centerZ;
      const distFromCenter = Math.sqrt(nx * nx + nz * nz) / maxDist;

      const islandFalloff = Math.pow(Math.max(0, 1 - distFromCenter * 1.15), 1.6);

      const n1 = perlin.fbm2D(x * baseFrequency, z * baseFrequency, 5);
      const n2 = perlin.fbm2D(x * baseFrequency * 2.2 + 100, z * baseFrequency * 2.2 + 100, 3);
      const n3 = perlin.fbm2D(x * baseFrequency * 0.5 + 300, z * baseFrequency * 0.5 + 300, 3);

      let h = 0;
      h += (n1 * 0.55 + 0.55) * amplitude;
      h += (n2 * 0.5 + 0.45) * amplitude * 0.28;
      h += (n3 * 0.5 + 0.5) * amplitude * 0.42;

      h *= islandFalloff;
      h = Math.max(0, Math.floor(h));

      heights[x][z] = h;
    }
  }

  const caveBranches = Math.floor(params.caveComplexity);
  const maxHeight = Math.floor(amplitude);
  const caveMap: boolean[][][] = [];

  for (let x = 0; x < size; x++) {
    caveMap[x] = [];
    for (let z = 0; z < size; z++) {
      caveMap[x][z] = [];
      for (let y = 0; y < maxHeight + 4; y++) {
        caveMap[x][z][y] = false;
      }
    }
  }

  if (caveBranches > 0) {
    const caveCount = caveBranches * 2;
    for (let i = 0; i < caveCount; i++) {
      let cx = Math.floor(rng() * size * 0.6 + size * 0.2);
      let cz = Math.floor(rng() * size * 0.6 + size * 0.2);
      let cy = Math.floor(rng() * (waterLevel + 2) + 1);
      const length = 60 + caveBranches * 40;
      const tunnelWidth = 1 + caveBranches * 0.6;
      let angle = rng() * Math.PI * 2;
      let pitch = (rng() - 0.5) * 0.5;

      for (let step = 0; step < length; step++) {
        angle += (rng() - 0.5) * 0.6;
        pitch += (rng() - 0.5) * 0.3;
        pitch = Math.max(-0.4, Math.min(0.4, pitch));

        cx += Math.cos(angle) * 0.8;
        cz += Math.sin(angle) * 0.8;
        cy += Math.sin(pitch) * 0.6;

        const xi = Math.floor(cx);
        const zi = Math.floor(cz);
        const yi = Math.floor(cy);

        if (xi < 2 || xi >= size - 2 || zi < 2 || zi >= size - 2) break;
        if (yi < 0 || yi > heights[xi][zi] - 1) continue;

        const radius = tunnelWidth + perlin.fbm3D(xi * 0.15, yi * 0.15, zi * 0.15, 2) * 1.2;

        for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
          for (let dz = -Math.ceil(radius); dz <= Math.ceil(radius); dz++) {
            for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy++) {
              const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);
              if (dist <= radius) {
                const tx = xi + dx;
                const tz = zi + dz;
                const ty = yi + dy;
                if (
                  tx >= 0 && tx < size &&
                  tz >= 0 && tz < size &&
                  ty >= 0 && ty < caveMap[0][0].length &&
                  ty < heights[tx][tz]
                ) {
                  caveMap[tx][tz][ty] = true;
                }
              }
            }
          }
        }
      }
    }
  }

  const treePositions: Array<{ x: number; z: number; y: number }> = [];
  const treeChance = (params.treeDensity / 100) * 0.08;

  for (let x = 2; x < size - 2; x++) {
    for (let z = 2; z < size - 2; z++) {
      const h = heights[x][z];
      if (h <= waterLevel + 0.5) continue;
      if (h > amplitude * 0.7) continue;

      if (rng() < treeChance) {
        let tooClose = false;
        for (const t of treePositions) {
          const dx = t.x - x;
          const dz = t.z - z;
          if (dx * dx + dz * dz < 9) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) {
          treePositions.push({ x, z, y: h });
        }
      }
    }
  }

  return {
    heights,
    waterLevel,
    size,
    treePositions,
    caveMap,
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function exportHeightmapJSON(voxel: VoxelData): string {
  const data = {
    version: '1.0',
    generator: 'AbyssEcho-Voxel-World',
    size: voxel.size,
    waterLevel: voxel.waterLevel,
    heights: voxel.heights,
    trees: voxel.treePositions,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
