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

const DEFAULT_AMPLITUDE_MIN = 1;
const DEFAULT_AMPLITUDE_MAX = 10;
const DEFAULT_FREQUENCY_MIN = 0.1;
const DEFAULT_FREQUENCY_MAX = 10;
const DEFAULT_SEALEVEL_MIN = -5;
const DEFAULT_SEALEVEL_MAX = 5;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function validateTerrainParams(params: TerrainParams): TerrainParams {
  try {
    const safe = {
      amplitude: clamp(
        typeof params.amplitude === 'number' && isFinite(params.amplitude)
          ? params.amplitude
          : 5,
        DEFAULT_AMPLITUDE_MIN,
        DEFAULT_AMPLITUDE_MAX
      ),
      frequency: clamp(
        typeof params.frequency === 'number' && isFinite(params.frequency) && params.frequency > 0
          ? params.frequency
          : 2,
        DEFAULT_FREQUENCY_MIN,
        DEFAULT_FREQUENCY_MAX
      ),
      seaLevel: clamp(
        typeof params.seaLevel === 'number' && isFinite(params.seaLevel)
          ? params.seaLevel
          : 0,
        DEFAULT_SEALEVEL_MIN,
        DEFAULT_SEALEVEL_MAX
      ),
    };
    return safe;
  } catch {
    return { amplitude: 5, frequency: 2, seaLevel: 0 };
  }
}

export function validatePathPoint(p: unknown): p is PathPoint {
  if (!p || typeof p !== 'object') return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.x === 'number' && isFinite(obj.x) &&
    typeof obj.y === 'number' && isFinite(obj.y) &&
    typeof obj.z === 'number' && isFinite(obj.z)
  );
}

export function validateExportData(data: unknown): ExportData | null {
  try {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    if (!obj.terrainParams || typeof obj.terrainParams !== 'object') return null;
    if (!obj.pathPoints || !Array.isArray(obj.pathPoints)) return null;

    const safeParams = validateTerrainParams(obj.terrainParams as TerrainParams);
    const safePoints: PathPoint[] = [];
    const points = obj.pathPoints as unknown[];
    for (const p of points) {
      if (validatePathPoint(p)) {
        safePoints.push(p as PathPoint);
      }
    }

    return {
      terrainParams: safeParams,
      pathPoints: safePoints,
      gridSize: typeof obj.gridSize === 'number' ? obj.gridSize : GRID_SIZE,
    };
  } catch {
    return null;
  }
}

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
  let s = Math.abs(Math.floor(seed)) % 2147483646;
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
  try {
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
  } catch {
    return 0;
  }
}

export function generateTerrain(params: TerrainParams, resolution: number = GRID_RESOLUTION): Float32Array {
  try {
    const safeParams = validateTerrainParams(params);
    const safeRes = clamp(
      typeof resolution === 'number' && isFinite(resolution) && resolution > 0
        ? Math.floor(resolution)
        : GRID_RESOLUTION,
      2,
      GRID_RESOLUTION
    );
    const heights = new Float32Array(safeRes * safeRes);
    const { amplitude, frequency, seaLevel } = safeParams;

    for (let y = 0; y < safeRes; y++) {
      for (let x = 0; x < safeRes; x++) {
        const nx = (x / safeRes) * frequency;
        const ny = (y / safeRes) * frequency;
        let h = 0;
        h += perlin2(nx, ny) * 0.5;
        h += perlin2(nx * 2, ny * 2) * 0.25;
        h += perlin2(nx * 4, ny * 4) * 0.125;
        h = h * amplitude - seaLevel;
        heights[y * safeRes + x] = h;
      }
    }

    return heights;
  } catch (e) {
    console.error('generateTerrain error:', e);
    return new Float32Array(resolution * resolution);
  }
}

export function getHeightAt(
  heights: Float32Array,
  x: number,
  y: number,
  resolution: number = GRID_RESOLUTION
): number {
  try {
    if (!heights || heights.length === 0) return 0;
    const safeRes = typeof resolution === 'number' ? resolution : GRID_RESOLUTION;
    const ix = Math.max(0, Math.min(safeRes - 1, isFinite(x) ? Math.floor(x) : 0));
    const iy = Math.max(0, Math.min(safeRes - 1, isFinite(y) ? Math.floor(y) : 0));
    const idx = iy * safeRes + ix;
    const val = heights[idx];
    return typeof val === 'number' && isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

export function gridToWorld(
  gridX: number,
  gridY: number,
  heights: Float32Array,
  size: number = GRID_SIZE,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number; z: number } {
  try {
    const safeSize = typeof size === 'number' && isFinite(size) && size > 0 ? size : GRID_SIZE;
    const safeRes = typeof resolution === 'number' && isFinite(resolution) && resolution > 0 ? resolution : GRID_RESOLUTION;
    const safeGX = clamp(isFinite(gridX) ? gridX : 0, 0, safeRes - 1);
    const safeGY = clamp(isFinite(gridY) ? gridY : 0, 0, safeRes - 1);
    const x = (safeGX / safeRes) * safeSize - safeSize / 2;
    const z = (safeGY / safeRes) * safeSize - safeSize / 2;
    const y = getHeightAt(heights, safeGX, safeGY, safeRes);
    return { x, y, z };
  } catch (e) {
    console.error('gridToWorld error:', e);
    return { x: 0, y: 0, z: 0 };
  }
}

export function worldToGrid(
  worldX: number,
  worldZ: number,
  size: number = GRID_SIZE,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number } {
  const safeSize = typeof size === 'number' && isFinite(size) && size > 0 ? size : GRID_SIZE;
  const safeRes = typeof resolution === 'number' && isFinite(resolution) && resolution > 0 ? resolution : GRID_RESOLUTION;
  try {
    const safeWX = isFinite(worldX) ? worldX : 0;
    const safeWZ = isFinite(worldZ) ? worldZ : 0;
    const x = ((safeWX + safeSize / 2) / safeSize) * safeRes;
    const y = ((safeWZ + safeSize / 2) / safeSize) * safeRes;
    return { x, y };
  } catch (e) {
    console.error('worldToGrid error:', e);
    return { x: safeRes / 2, y: safeRes / 2 };
  }
}

export function screenToGrid(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number } {
  const safeCW = typeof canvasWidth === 'number' && isFinite(canvasWidth) && canvasWidth > 0 ? canvasWidth : 1;
  const safeCH = typeof canvasHeight === 'number' && isFinite(canvasHeight) && canvasHeight > 0 ? canvasHeight : 1;
  const safeRes = typeof resolution === 'number' && isFinite(resolution) && resolution > 0 ? resolution : GRID_RESOLUTION;
  try {
    const safeSX = clamp(isFinite(screenX) ? screenX : 0, 0, safeCW);
    const safeSY = clamp(isFinite(screenY) ? screenY : 0, 0, safeCH);
    const x = (safeSX / safeCW) * safeRes;
    const y = (safeSY / safeCH) * safeRes;
    return { x, y };
  } catch (e) {
    console.error('screenToGrid error:', e);
    return { x: safeRes / 2, y: safeRes / 2 };
  }
}

export function gridToScreen(
  gridX: number,
  gridY: number,
  canvasWidth: number,
  canvasHeight: number,
  resolution: number = GRID_RESOLUTION
): { x: number; y: number } {
  const safeCW = typeof canvasWidth === 'number' && isFinite(canvasWidth) && canvasWidth > 0 ? canvasWidth : 1;
  const safeCH = typeof canvasHeight === 'number' && isFinite(canvasHeight) && canvasHeight > 0 ? canvasHeight : 1;
  const safeRes = typeof resolution === 'number' && isFinite(resolution) && resolution > 0 ? resolution : GRID_RESOLUTION;
  try {
    const safeGX = isFinite(gridX) ? gridX : 0;
    const safeGY = isFinite(gridY) ? gridY : 0;
    const x = (safeGX / safeRes) * safeCW;
    const y = (safeGY / safeRes) * safeCH;
    return { x, y };
  } catch (e) {
    console.error('gridToScreen error:', e);
    return { x: safeCW / 2, y: safeCH / 2 };
  }
}

export function interpolateHeights(
  from: Float32Array,
  to: Float32Array,
  t: number
): Float32Array {
  try {
    if (!from || !to) return new Float32Array(0);
    const len = Math.min(from.length, to.length);
    const result = new Float32Array(len);
    const safeT = clamp(isFinite(t) ? t : 0, 0, 1);
    for (let i = 0; i < len; i++) {
      const a = from[i] || 0;
      const b = to[i] || 0;
      result[i] = lerp(a, b, safeT);
    }
    return result;
  } catch (e) {
    console.error('interpolateHeights error:', e);
    return from || new Float32Array(0);
  }
}

export interface ContourLevel {
  height: number;
  color: string;
}

export function computeContourLevels(amplitude: number): ContourLevel[] {
  try {
    const safeAmp = clamp(
      typeof amplitude === 'number' && isFinite(amplitude) && amplitude > 0
        ? amplitude
        : 5,
      1,
      10
    );

    const targetCount = Math.round(clamp(safeAmp * 2 + 4, 8, 24));
    const minH = -safeAmp - 2;
    const maxH = safeAmp + 2;
    const range = maxH - minH;
    const step = range / (targetCount - 1);

    const levels: ContourLevel[] = [];

    for (let i = 0; i < targetCount; i++) {
      const height = minH + i * step;
      const ratio = i / (targetCount - 1);

      const t = (height - minH) / range;

      let r: number, g: number, b: number;
      if (height < -safeAmp * 0.3) {
        const deepT = clamp((height - minH) / (-safeAmp * 0.3 - minH), 0, 1);
        r = Math.round(30 + deepT * 50);
        g = Math.round(50 + deepT * 70);
        b = Math.round(90 + deepT * 80);
      } else if (height < safeAmp * 0.2) {
        const midLowT = clamp((height - (-safeAmp * 0.3)) / (safeAmp * 0.5), 0, 1);
        r = Math.round(80 + midLowT * 60);
        g = Math.round(120 + midLowT * 50);
        b = Math.round(170 - midLowT * 80);
      } else if (height < safeAmp * 0.7) {
        const midT = clamp((height - safeAmp * 0.2) / (safeAmp * 0.5), 0, 1);
        r = Math.round(140 + midT * 40);
        g = Math.round(170 - midT * 30);
        b = Math.round(90 - midT * 30);
      } else {
        const highT = clamp((height - safeAmp * 0.7) / (maxH - safeAmp * 0.7), 0, 1);
        r = Math.round(180 + highT * 60);
        g = Math.round(140 + highT * 80);
        b = Math.round(60 + highT * 140);
      }

      const grayBase = Math.round(60 + ratio * 130);
      r = Math.round(r * 0.4 + grayBase * 0.6);
      g = Math.round(g * 0.4 + grayBase * 0.6);
      b = Math.round(b * 0.4 + (grayBase + 10) * 0.6);

      levels.push({
        height,
        color: `rgb(${Math.max(40, Math.min(220, r))}, ${Math.max(40, Math.min(220, g))}, ${Math.max(45, Math.min(230, b))})`,
      });
    }

    return levels;
  } catch (e) {
    console.error('computeContourLevels error:', e);
    return [{ height: 0, color: 'rgb(120, 120, 130)' }];
  }
}

export function easeOutCubic(t: number): number {
  try {
    const safeT = clamp(isFinite(t) ? t : 0, 0, 1);
    return 1 - Math.pow(1 - safeT, 3);
  } catch {
    return 0;
  }
}

export function easeOutElastic(t: number): number {
  try {
    const safeT = clamp(isFinite(t) ? t : 0, 0, 1);
    const c4 = (2 * Math.PI) / 3;
    return safeT === 0
      ? 0
      : safeT === 1
      ? 1
      : Math.pow(2, -10 * safeT) * Math.sin((safeT * 10 - 0.75) * c4) + 1;
  } catch {
    return clamp(t, 0, 1);
  }
}

export function easeInOutCubic(t: number): number {
  try {
    const safeT = clamp(isFinite(t) ? t : 0, 0, 1);
    return safeT < 0.5 ? 4 * safeT * safeT * safeT : 1 - Math.pow(-2 * safeT + 2, 3) / 2;
  } catch {
    return clamp(t, 0, 1);
  }
}
