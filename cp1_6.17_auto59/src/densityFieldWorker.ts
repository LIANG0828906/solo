import type { WorkerMessage, DensityField, DensityFieldConfig, DatasetType } from './types';

class PerlinNoise3D {
  private perm: Int32Array;
  private gradP: Array<[number, number, number]>;

  private static readonly grad3: Array<[number, number, number]> = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];

  constructor(seed: number = Math.random() * 65536) {
    const p = new Int32Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    let n: number;
    let q: number;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      n = seed % (i + 1);
      q = p[i];
      p[i] = p[n];
      p[n] = q;
    }

    this.perm = new Int32Array(512);
    this.gradP = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.gradP[i] = PerlinNoise3D.grad3[this.perm[i] % 12];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }

  noise(x: number, y: number, z: number): number {
    let X = Math.floor(x);
    let Y = Math.floor(y);
    let Z = Math.floor(z);

    x = x - X;
    y = y - Y;
    z = z - Z;

    X = X & 255;
    Y = Y & 255;
    Z = Z & 255;

    const n000 = this.gradP[X + this.perm[Y + this.perm[Z]]];
    const n001 = this.gradP[X + this.perm[Y + this.perm[Z + 1]]];
    const n010 = this.gradP[X + this.perm[Y + 1 + this.perm[Z]]];
    const n011 = this.gradP[X + this.perm[Y + 1 + this.perm[Z + 1]]];
    const n100 = this.gradP[X + 1 + this.perm[Y + this.perm[Z]]];
    const n101 = this.gradP[X + 1 + this.perm[Y + this.perm[Z + 1]]];
    const n110 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z]]];
    const n111 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]];

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const dot = (g: [number, number, number], x: number, y: number, z: number) =>
      g[0] * x + g[1] * y + g[2] * z;

    const n00 = this.lerp(dot(n000, x, y, z), dot(n100, x - 1, y, z), u);
    const n10 = this.lerp(dot(n010, x, y - 1, z), dot(n110, x - 1, y - 1, z), u);
    const n01 = this.lerp(dot(n001, x, y, z - 1), dot(n101, x - 1, y, z - 1), u);
    const n11 = this.lerp(dot(n011, x, y - 1, z - 1), dot(n111, x - 1, y - 1, z - 1), u);

    const n0 = this.lerp(n00, n10, v);
    const n1 = this.lerp(n01, n11, v);

    return this.lerp(n0, n1, w);
  }

  octaveNoise(x: number, y: number, z: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

function normalizeField(field: DensityField): void {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < field.length; i++) {
    if (field[i] < min) min = field[i];
    if (field[i] > max) max = field[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < field.length; i++) {
    field[i] = (field[i] - min) / range;
  }
}

function generatePerlinField(size: number, seed: number, progressCb: (p: number) => void): DensityField {
  const noise = new PerlinNoise3D(seed);
  const field = new Float32Array(size * size * size);
  const scale = 4 / size;

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = x + y * size + z * size * size;
        field[idx] = noise.octaveNoise(x * scale, y * scale, z * scale, 4, 0.5);
      }
    }
    if (z % 8 === 0) progressCb(z / size);
  }

  normalizeField(field);
  return field;
}

function generateTaurusField(size: number, seed: number, progressCb: (p: number) => void): DensityField {
  const noise = new PerlinNoise3D(seed);
  const field = new Float32Array(size * size * size);
  const scale = 3 / size;
  const half = size / 2;

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = x + y * size + z * size * size;
        const nx = (x - half) * scale;
        const ny = (y - half) * scale;
        const nz = (z - half) * scale;

        const fiberTwist = Math.sin(nx * 2 + ny * 1.5) * 0.3 + Math.cos(nz * 2 - ny) * 0.2;
        const baseNoise = noise.octaveNoise(nx + fiberTwist, ny * 0.6, nz + fiberTwist, 4, 0.55);

        const diagFactor = 1 - Math.abs(nx - ny) / 4;
        const density = Math.max(0, baseNoise * 0.6 + Math.max(0, diagFactor) * 0.5);

        field[idx] = density;
      }
    }
    if (z % 8 === 0) progressCb(z / size);
  }

  normalizeField(field);
  return field;
}

function generateOrionField(size: number, seed: number, progressCb: (p: number) => void): DensityField {
  const noise = new PerlinNoise3D(seed);
  const field = new Float32Array(size * size * size);
  const scale = 3.5 / size;
  const half = size / 2;

  const cores = [
    { cx: 0.35, cy: 0.45, cz: 0.55, radius: 0.18 },
    { cx: 0.65, cy: 0.55, cz: 0.45, radius: 0.14 },
    { cx: 0.5, cy: 0.35, cz: 0.4, radius: 0.12 },
    { cx: 0.45, cy: 0.65, cz: 0.6, radius: 0.1 }
  ];

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = x + y * size + z * size * size;
        const nx = x / size;
        const ny = y / size;
        const nz = z / size;

        let coreDensity = 0;
        for (const core of cores) {
          const dx = nx - core.cx;
          const dy = ny - core.cy;
          const dz = nz - core.cz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          coreDensity += Math.max(0, 1 - dist / core.radius);
        }

        const noiseX = (x - half) * scale;
        const noiseY = (y - half) * scale;
        const noiseZ = (z - half) * scale;
        const turbNoise = noise.octaveNoise(noiseX, noiseY, noiseZ, 3, 0.6);

        const distFromCenter = Math.sqrt(
          (nx - 0.5) ** 2 + (ny - 0.5) ** 2 + (nz - 0.5) ** 2
        );
        const sphereFalloff = Math.max(0, 1 - distFromCenter / 0.6);

        field[idx] = turbNoise * 0.35 + coreDensity * 0.5 + sphereFalloff * 0.25;
      }
    }
    if (z % 8 === 0) progressCb(z / size);
  }

  normalizeField(field);
  return field;
}

function generateField(config: DensityFieldConfig, progressCb: (p: number) => void): DensityField {
  const { size, dataset, seed = 12345 } = config;

  switch (dataset) {
    case 'taurus':
      return generateTaurusField(size, seed, progressCb);
    case 'orion':
      return generateOrionField(size, seed, progressCb);
    case 'perlin':
    default:
      return generatePerlinField(size, seed, progressCb);
  }
}

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent) => {
  const msg = e.data as WorkerMessage;

  if (msg.type === 'generate') {
    try {
      const data = generateField(msg.config, (progress) => {
        const progMsg: WorkerMessage = { type: 'progress', progress };
        ctx.postMessage(progMsg);
      });

      const resultMsg: WorkerMessage = { type: 'result', data, size: msg.config.size };
      ctx.postMessage(resultMsg, [data.buffer]);
    } catch (err) {
      const errMsg: WorkerMessage = {
        type: 'error',
        error: err instanceof Error ? err.message : String(err)
      };
      ctx.postMessage(errMsg);
    }
  }
};
