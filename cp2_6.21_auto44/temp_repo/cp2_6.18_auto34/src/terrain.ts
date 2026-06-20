export interface TerrainData {
  positions: Float32Array;
  colors: Float32Array;
  heights: Float32Array;
  count: number;
}

export interface TerrainParams {
  resolution: number;
  amplitude: number;
  startColor: string;
  endColor: string;
  cellSize: number;
  frequency: number;
}

const DEFAULT_CELL_SIZE = 0.5;
const DEFAULT_FREQUENCY = 0.1;
const DEFAULT_MID_COLOR = '#2E8B57';

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

class PerlinNoise {
  private permutation: Uint8Array;

  constructor(seed: number = 1337) {
    this.permutation = this.buildPermutation(seed);
  }

  private buildPermutation(seed: number): Uint8Array {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return perm;
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const p = this.permutation;
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  const num = parseInt(full, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  };
}

function mixColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t
  };
}

export class TerrainGenerator {
  private perlin: PerlinNoise;
  private data: TerrainData;
  private params: TerrainParams;
  private midColorRgb: { r: number; g: number; b: number };

  constructor() {
    this.perlin = new PerlinNoise(42);
    this.params = {
      resolution: 30,
      amplitude: 3,
      startColor: '#0A0A3A',
      endColor: '#FFFFFF',
      cellSize: DEFAULT_CELL_SIZE,
      frequency: DEFAULT_FREQUENCY
    };
    this.data = {
      positions: new Float32Array(),
      colors: new Float32Array(),
      heights: new Float32Array(),
      count: 0
    };
    this.midColorRgb = hexToRgb(DEFAULT_MID_COLOR);
  }

  getParams(): TerrainParams {
    return { ...this.params };
  }

  getData(): TerrainData {
    return this.data;
  }

  setResolution(resolution: number): TerrainData {
    this.params.resolution = resolution;
    return this.regenerate();
  }

  setAmplitude(amplitude: number): TerrainData {
    this.params.amplitude = amplitude;
    return this.recomputeHeights();
  }

  setStartColor(color: string): TerrainData {
    this.params.startColor = color;
    this.recomputeColors();
    return this.data;
  }

  setEndColor(color: string): TerrainData {
    this.params.endColor = color;
    this.recomputeColors();
    return this.data;
  }

  reset(): TerrainData {
    this.perlin = new PerlinNoise(42);
    this.params.resolution = 30;
    this.params.amplitude = 3;
    this.params.startColor = '#0A0A3A';
    this.params.endColor = '#FFFFFF';
    return this.regenerate();
  }

  regenerate(): TerrainData {
    const { resolution, amplitude, frequency, cellSize } = this.params;
    const count = resolution * resolution;
    const positions = new Float32Array(count * 3);
    const heights = new Float32Array(count);
    const half = ((resolution - 1) * cellSize) / 2;

    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const idx = j * resolution + i;
        const x = i * cellSize - half;
        const z = j * cellSize - half;
        const n1 = this.perlin.noise2D(x * frequency, z * frequency);
        const n2 = this.perlin.noise2D(x * frequency * 2.1 + 37, z * frequency * 2.1 - 19) * 0.5;
        const n3 = this.perlin.noise2D(x * frequency * 4.3 - 11, z * frequency * 4.3 + 27) * 0.25;
        const raw = (n1 + n2 + n3) / 1.75;
        const h = raw * amplitude;
        heights[idx] = h;
        positions[idx * 3 + 0] = x;
        positions[idx * 3 + 1] = h;
        positions[idx * 3 + 2] = z;
      }
    }

    this.data.positions = positions;
    this.data.heights = heights;
    this.data.count = count;
    this.recomputeColors();
    return this.data;
  }

  private recomputeHeights(): TerrainData {
    const { resolution, amplitude, frequency, cellSize } = this.params;
    const half = ((resolution - 1) * cellSize) / 2;
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const idx = j * resolution + i;
        const x = i * cellSize - half;
        const z = j * cellSize - half;
        const n1 = this.perlin.noise2D(x * frequency, z * frequency);
        const n2 = this.perlin.noise2D(x * frequency * 2.1 + 37, z * frequency * 2.1 - 19) * 0.5;
        const n3 = this.perlin.noise2D(x * frequency * 4.3 - 11, z * frequency * 4.3 + 27) * 0.25;
        const raw = (n1 + n2 + n3) / 1.75;
        const h = raw * amplitude;
        this.data.heights[idx] = h;
        this.data.positions[idx * 3 + 1] = h;
      }
    }
    this.recomputeColors();
    return this.data;
  }

  editHeight(
    centerX: number,
    centerZ: number,
    radius: number,
    delta: number,
    minH: number,
    maxH: number
  ): { updated: boolean } {
    const { resolution, cellSize } = this.params;
    const half = ((resolution - 1) * cellSize) / 2;
    const r2 = radius * radius;
    let updated = false;

    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const idx = j * resolution + i;
        const x = i * cellSize - half;
        const z = j * cellSize - half;
        const dx = x - centerX;
        const dz = z - centerZ;
        const dist2 = dx * dx + dz * dz;
        if (dist2 <= r2) {
          const falloff = 1 - Math.sqrt(dist2) / radius;
          const influence = falloff * falloff;
          const newH = Math.min(maxH, Math.max(minH, this.data.heights[idx] + delta * influence));
          if (newH !== this.data.heights[idx]) {
            this.data.heights[idx] = newH;
            this.data.positions[idx * 3 + 1] = newH;
            updated = true;
          }
        }
      }
    }

    if (updated) {
      this.recomputeColors();
    }
    return { updated };
  }

  private recomputeColors(): void {
    const { count, heights } = this.data;
    const start = hexToRgb(this.params.startColor);
    const end = hexToRgb(this.params.endColor);
    const mid = this.midColorRgb;
    const colors = new Float32Array(count * 3);

    const amplitude = Math.max(this.params.amplitude, 0.0001);
    const minH = -amplitude * 1.2;
    const maxH = amplitude * 1.2;
    const range = maxH - minH;

    for (let idx = 0; idx < count; idx++) {
      const h = heights[idx];
      const t = Math.max(0, Math.min(1, (h - minH) / range));
      const eased = easeInOutCubic(t);

      let c: { r: number; g: number; b: number };
      if (eased < 0.5) {
        const localT = eased * 2;
        c = mixColor(start, mid, localT);
      } else {
        const localT = (eased - 0.5) * 2;
        c = mixColor(mid, end, localT);
      }

      colors[idx * 3 + 0] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
    }

    this.data.colors = colors;
  }
}
