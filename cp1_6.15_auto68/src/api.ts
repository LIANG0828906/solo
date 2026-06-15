export interface TerrainParams {
  amplitude: number;
  frequency: number;
  seaLevel: number;
}

export interface PathPoint {
  x: number;
  y: number;
  z: number;
}

export interface ExportData {
  terrainParams: TerrainParams;
  pathPoints: PathPoint[];
  gridSize: number;
}

export const GRID_SIZE = 200;
export const GRID_RESOLUTION = 200;

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

function generatePermutation(seed: number): number[] {
  const p: number[] = [];
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
}

const PERM = generatePermutation(42);

function perlin2(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const A = PERM[X] + Y;
  const B = PERM[X + 1] + Y;
  return lerp(
    lerp(grad(PERM[A], x, y), grad(PERM[B], x - 1, y), u),
    lerp(grad(PERM[A + 1], x, y - 1), grad(PERM[B + 1], x - 1, y - 1), u),
    v
  );
}

export function generateTerrain(params: TerrainParams, resolution: number = GRID_RESOLUTION): Float32Array {
  const heights = new Float32Array(resolution * resolution);
  const { amplitude, frequency, seaLevel } = params;
  const start = performance.now();

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const nx = (x / resolution) * frequency;
      const ny = (y / resolution) * frequency;
      let h = 0;
      h += perlin2(nx, ny) * 0.5;
      h += perlin2(nx * 2, ny * 2) * 0.25;
      h += perlin2(nx * 4, ny * 4) * 0.125;
      h = h * amplitude - seaLevel;
      heights[y * resolution + x] = h;
    }
  }

  return heights;
}

export function getHeightAt(
  heights: Float32Array,
  x: number,
  y: number,
  resolution: number = GRID_RESOLUTION
): number {
  const ix = Math.max(0, Math.min(resolution - 1, Math.floor(x)));
  const iy = Math.max(0, Math.min(resolution - 1, Math.floor(y)));
  return heights[iy * resolution + ix];
}

export function gridToWorld(
  gridX: number,
  gridY: number,
  heights: Float32Array,
  size: number = GRID_SIZE,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number; z: number } {
  const x = (gridX / resolution) * size - size / 2;
  const z = (gridY / resolution) * size - size / 2;
  const y = getHeightAt(heights, gridX, gridY, resolution);
  return { x, y, z };
}

export function worldToGrid(
  worldX: number,
  worldZ: number,
  size: number = GRID_SIZE,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number } {
  const x = ((worldX + size / 2) / size) * resolution;
  const y = ((worldZ + size / 2) / size) * resolution;
  return { x, y };
}

export function screenToGrid(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number } {
  const x = (screenX / canvasWidth) * resolution;
  const y = (screenY / canvasHeight) * resolution;
  return { x, y };
}

export function gridToScreen(
  gridX: number,
  gridY: number,
  canvasWidth: number,
  canvasHeight: number,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number } {
  const x = (gridX / resolution) * canvasWidth;
  const y = (gridY / resolution) * canvasHeight;
  return { x, y };
}

export function interpolateHeights(
  from: Float32Array,
  to: Float32Array,
  t: number
): Float32Array {
  const result = new Float32Array(from.length);
  for (let i = 0; i < from.length; i++) {
    result[i] = lerp(from[i], to[i], t);
  }
  return result;
}

export function computeContourLevels(amplitude: number): number[] {
  const step = Math.max(0.2, amplitude / 10);
  const levels: number[] = [];
  for (let h = -amplitude; h <= amplitude; h += step) {
    levels.push(h);
  }
  return levels;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
