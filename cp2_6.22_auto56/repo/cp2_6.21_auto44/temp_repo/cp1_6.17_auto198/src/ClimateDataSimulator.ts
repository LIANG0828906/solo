const LAT_COUNT = 19;
const LON_COUNT = 37;
const MIN_TEMP = -3;
const MAX_TEMP = 3;

type TemperatureGrid = number[][];

function mulberry32(seed: number): () => number {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class SimplexNoiseLite {
  private perm: Uint8Array;
  private gradP: Int8Array;

  constructor(seed: number) {
    const rand = mulberry32(seed);
    const perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    this.perm = perm;

    const grad3 = new Int8Array([
      1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
      1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
      0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
    ]);
    const gradP = new Int8Array(512 * 3);
    for (let i = 0; i < 512; i++) {
      const gi = (perm[i] % 12) * 3;
      gradP[i * 3] = grad3[gi];
      gradP[i * 3 + 1] = grad3[gi + 1];
      gradP[i * 3 + 2] = grad3[gi + 2];
    }
    this.gradP = gradP;
  }

  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    let i1: number, j1: number;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const perm = this.perm;
    const gradP = this.gradP;

    const dot = (gi: number, xa: number, ya: number) =>
      gradP[gi * 3] * xa + gradP[gi * 3 + 1] * ya;

    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * dot(perm[ii + perm[jj]], x0, y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * dot(perm[ii + i1 + perm[jj + j1]], x1, y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * dot(perm[ii + 1 + perm[jj + 1]], x2, y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  noise3D(x: number, y: number, z: number): number {
    let n = 0;
    n += this.noise2D(x, y) * 0.6;
    n += this.noise2D(x + z * 1.3, y - z * 0.7) * 0.4;
    return n;
  }
}

const CACHE_SIZE = 20;

class ClimateDataSimulator {
  private noise: SimplexNoiseLite;
  private cache: Map<number, TemperatureGrid> = new Map();
  private lruOrder: number[] = [];

  constructor(seed: number = 20240617) {
    this.noise = new SimplexNoiseLite(seed);
  }

  private clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v;
  }

  private gridToData(grid: TemperatureGrid): TemperatureGrid {
    const out: TemperatureGrid = new Array(LAT_COUNT);
    for (let i = 0; i < LAT_COUNT; i++) {
      out[i] = grid[i].slice();
    }
    return out;
  }

  private generate(year: number): TemperatureGrid {
    const yearProgress = this.clamp((year - 1900) / (2023 - 1900), 0, 1);
    const globalBase = -0.5 + yearProgress * 3.5;

    const data: TemperatureGrid = new Array(LAT_COUNT);

    for (let i = 0; i < LAT_COUNT; i++) {
      const row = new Array(LON_COUNT);
      const lat = -90 + i * 10;
      const absLat = Math.abs(lat);
      const polarFactor = 1 + (absLat / 90) * 0.8;

      for (let j = 0; j < LON_COUNT; j++) {
        const lon = -180 + j * 10;

        const spatialNoise = this.noise.noise2D(lon * 0.04, lat * 0.04) * 1.2;
        const annualNoise = this.noise.noise3D(lon * 0.018, lat * 0.018, year * 0.08) * 0.5;

        const elNino =
          absLat < 15
            ? Math.sin((lon * Math.PI) / 90 + year * 0.3) * 0.4
            : 0;

        const latBand = absLat > 60 ? 0.3 * (absLat - 60) / 30 : 0;
        const temp =
          (globalBase + spatialNoise + annualNoise + elNino + latBand) *
          polarFactor;

        row[j] = this.clamp(temp, MIN_TEMP, MAX_TEMP);
      }
      data[i] = row;
    }

    this.smoothEdges(data);
    return data;
  }

  private smoothEdges(data: TemperatureGrid): void {
    for (let i = 0; i < LAT_COUNT; i++) {
      const first = data[i][0];
      const last = data[i][LON_COUNT - 1];
      const avg = (first + last) / 2;
      data[i][0] = avg;
      data[i][LON_COUNT - 1] = avg;
    }
  }

  getDataForYear(year: number): TemperatureGrid {
    const rounded = Math.round(year);
    if (this.cache.has(rounded)) {
      const idx = this.lruOrder.indexOf(rounded);
      if (idx > 0) {
        this.lruOrder.splice(idx, 1);
        this.lruOrder.unshift(rounded);
      }
      return this.gridToData(this.cache.get(rounded)!);
    }

    const data = this.generate(rounded);
    this.cache.set(rounded, this.gridToData(data));
    this.lruOrder.unshift(rounded);
    if (this.lruOrder.length > CACHE_SIZE) {
      const evict = this.lruOrder.pop()!;
      this.cache.delete(evict);
    }
    return data;
  }
}

export { ClimateDataSimulator, LAT_COUNT, LON_COUNT, MIN_TEMP, MAX_TEMP };
export type { TemperatureGrid };
