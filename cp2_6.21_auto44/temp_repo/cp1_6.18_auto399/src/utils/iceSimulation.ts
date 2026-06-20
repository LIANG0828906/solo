export const GRID_SIZE = 100;
export const PLANE_SIZE = 20;
export const ICE_BASE_HEIGHT = 3;
export const TERRAIN_BASE_HEIGHT = 0.5;

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

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
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 16807) % 2147483647;
      const j = n % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
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

  fbm(x: number, y: number, octaves: number = 4): number {
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

const perlin = new PerlinNoise(42);

export function generateBaseHeightMap(): number[] {
  const heightMap: number[] = new Array(GRID_SIZE * GRID_SIZE);

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const index = y * GRID_SIZE + x;
      const nx = x / GRID_SIZE;
      const ny = y / GRID_SIZE;

      const terrainNoise = perlin.fbm(nx * 3, ny * 3, 4);
      const terrainHeight = (terrainNoise + 1) * 0.5 * TERRAIN_BASE_HEIGHT;

      const centerX = GRID_SIZE / 2;
      const centerY = GRID_SIZE / 2;
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDist = GRID_SIZE / 2;
      const edgeFactor = Math.max(0, 1 - distFromCenter / maxDist);
      const smoothEdge = Math.pow(edgeFactor, 1.5);

      const iceNoise = perlin.fbm(nx * 2 + 100, ny * 2 + 100, 3);
      const iceVariation = (iceNoise + 1) * 0.5 * 0.3;

      const iceHeight = (smoothEdge * ICE_BASE_HEIGHT) * (0.7 + iceVariation);

      heightMap[index] = terrainHeight + iceHeight;
    }
  }

  return heightMap;
}

export function calculateIceVolume(heightMap: number[]): number {
  let volume = 0;
  const cellSize = PLANE_SIZE / GRID_SIZE;

  for (let i = 0; i < heightMap.length; i++) {
    const h = Math.max(0, heightMap[i] - TERRAIN_BASE_HEIGHT * 0.3);
    volume += h * cellSize * cellSize;
  }

  return volume;
}

export function applyMelting(
  baseHeightMap: number[],
  temperatureOffset: number,
  timeProgress: number
): number[] {
  const result = [...baseHeightMap];
  const meltFactor = Math.max(0, temperatureOffset + 2) / 8;
  const totalMelt = meltFactor * timeProgress;

  for (let i = 0; i < result.length; i++) {
    const baseHeight = baseHeightMap[i];
    const iceThickness = Math.max(0, baseHeight - TERRAIN_BASE_HEIGHT * 0.3);

    const x = i % GRID_SIZE;
    const y = Math.floor(i / GRID_SIZE);
    const centerX = GRID_SIZE / 2;
    const centerY = GRID_SIZE / 2;
    const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDist = GRID_SIZE / 2;
    const edgeBias = 0.3 + 0.7 * (distFromCenter / maxDist);

    const meltAmount = totalMelt * ICE_BASE_HEIGHT * edgeBias;
    const newIceThickness = Math.max(0, iceThickness - meltAmount);
    const terrainHeight = TERRAIN_BASE_HEIGHT * 0.3;

    result[i] = terrainHeight + newIceThickness;
  }

  return result;
}

export function calculateSeaLevelEquivalent(volumeLoss: number): number {
  return volumeLoss * 0.5;
}

export function calculateVolumePercentage(currentVolume: number, initialVolume: number): number {
  if (initialVolume === 0) return 100;
  return (currentVolume / initialVolume) * 100;
}
