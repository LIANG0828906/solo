const TERRAIN_SIZE = 20;
const TERRAIN_SEGMENTS = 20;

const noiseCache = new Map<string, number>();

const getNoiseKey = (x: number, z: number): string => `${x.toFixed(2)},${z.toFixed(2)}`;

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const smoothNoise = (x: number, z: number): number => {
  const key = getNoiseKey(x, z);
  if (noiseCache.has(key)) {
    return noiseCache.get(key)!;
  }

  const corners = (
    seededRandom(x - 1 + (z - 1) * 57) +
    seededRandom(x + 1 + (z - 1) * 57) +
    seededRandom(x - 1 + (z + 1) * 57) +
    seededRandom(x + 1 + (z + 1) * 57)
  ) / 16;

  const sides = (
    seededRandom(x - 1 + z * 57) +
    seededRandom(x + 1 + z * 57) +
    seededRandom(x + (z - 1) * 57) +
    seededRandom(x + (z + 1) * 57)
  ) / 8;

  const center = seededRandom(x + z * 57) / 4;
  const value = corners + sides + center;

  noiseCache.set(key, value);
  return value;
};

const interpolatedNoise = (x: number, z: number): number => {
  const intX = Math.floor(x);
  const fracX = x - intX;
  const intZ = Math.floor(z);
  const fracZ = z - intZ;

  const v1 = smoothNoise(intX, intZ);
  const v2 = smoothNoise(intX + 1, intZ);
  const v3 = smoothNoise(intX, intZ + 1);
  const v4 = smoothNoise(intX + 1, intZ + 1);

  const i1 = v1 * (1 - fracX) + v2 * fracX;
  const i2 = v3 * (1 - fracX) + v4 * fracX;

  return i1 * (1 - fracZ) + i2 * fracZ;
};

export const getTerrainHeight = (x: number, z: number): number => {
  const scale = 0.15;
  const amplitude = 1.0;

  let height = 0;
  let freq = 1;
  let amp = amplitude;

  for (let i = 0; i < 3; i++) {
    height += interpolatedNoise(x * freq * scale, z * freq * scale) * amp;
    freq *= 2;
    amp *= 0.5;
  }

  return Math.max(0, Math.min(1, height));
};

export const generateTerrainHeights = (): number[] => {
  const heights: number[] = [];
  const halfSize = TERRAIN_SIZE / 2;
  const segmentSize = TERRAIN_SIZE / TERRAIN_SEGMENTS;

  for (let z = 0; z <= TERRAIN_SEGMENTS; z++) {
    for (let x = 0; x <= TERRAIN_SEGMENTS; x++) {
      const worldX = -halfSize + x * segmentSize;
      const worldZ = -halfSize + z * segmentSize;
      heights.push(getTerrainHeight(worldX, worldZ));
    }
  }

  return heights;
};

export const clampToTerrainBounds = (
  x: number,
  z: number
): { x: number; z: number } => {
  const halfSize = TERRAIN_SIZE / 2 - 0.5;
  return {
    x: Math.max(-halfSize, Math.min(halfSize, x)),
    z: Math.max(-halfSize, Math.min(halfSize, z)),
  };
};
