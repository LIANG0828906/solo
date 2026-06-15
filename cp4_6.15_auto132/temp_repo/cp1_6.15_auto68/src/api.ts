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

export function computeSlope(
  heights: Float32Array,
  gx: number,
  gy: number,
  resolution: number = GRID_RESOLUTION
): number {
  try {
    if (!heights || heights.length === 0) return 0;
    const safeRes = typeof resolution === 'number' && resolution > 1 ? resolution : GRID_RESOLUTION;
    const ix = clamp(Math.floor(gx), 0, safeRes - 1);
    const iy = clamp(Math.floor(gy), 0, safeRes - 1);

    const hL = ix > 0 ? heights[iy * safeRes + (ix - 1)] : heights[iy * safeRes + ix];
    const hR = ix < safeRes - 1 ? heights[iy * safeRes + (ix + 1)] : heights[iy * safeRes + ix];
    const hU = iy > 0 ? heights[(iy - 1) * safeRes + ix] : heights[iy * safeRes + ix];
    const hD = iy < safeRes - 1 ? heights[(iy + 1) * safeRes + ix] : heights[iy * safeRes + ix];

    const dx = (hR - hL) * 0.5;
    const dy = (hD - hU) * 0.5;
    return Math.sqrt(dx * dx + dy * dy);
  } catch {
    return 0;
  }
}

export function computeTerrainStats(heights: Float32Array): { min: number; max: number; mean: number; avgSlope: number } {
  try {
    if (!heights || heights.length === 0) {
      return { min: 0, max: 0, mean: 0, avgSlope: 0 };
    }
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let slopeSum = 0;
    const res = Math.floor(Math.sqrt(heights.length));

    for (let i = 0; i < heights.length; i++) {
      const v = heights[i];
      if (typeof v === 'number' && isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
      }
    }

    const step = Math.max(1, Math.floor(res / 40));
    let slopeCount = 0;
    for (let gy = 0; gy < res; gy += step) {
      for (let gx = 0; gx < res; gx += step) {
        slopeSum += computeSlope(heights, gx, gy, res);
        slopeCount++;
      }
    }

    return {
      min: isFinite(min) ? min : 0,
      max: isFinite(max) ? max : 0,
      mean: heights.length > 0 ? sum / heights.length : 0,
      avgSlope: slopeCount > 0 ? slopeSum / slopeCount : 0,
    };
  } catch (e) {
    console.error('computeTerrainStats error:', e);
    return { min: 0, max: 0, mean: 0, avgSlope: 0 };
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

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function computeContourLevels(
  amplitude: number,
  heights?: Float32Array
): ContourLevel[] {
  try {
    const safeAmp = clamp(
      typeof amplitude === 'number' && isFinite(amplitude) && amplitude > 0
        ? amplitude
        : 5,
      1,
      10
    );

    let minH = -safeAmp - 2;
    let maxH = safeAmp + 2;

    if (heights && heights.length > 0) {
      const stats = computeTerrainStats(heights);
      if (isFinite(stats.min) && isFinite(stats.max)) {
        const padding = (stats.max - stats.min) * 0.08 + 0.5;
        minH = stats.min - padding;
        maxH = stats.max + padding;
      }
    }

    const range = Math.max(0.5, maxH - minH);

    let baseCount = Math.round(clamp(safeAmp * 2 + 4, 8, 24));

    if (heights && heights.length > 0) {
      const stats = computeTerrainStats(heights);
      const slopeFactor = clamp(stats.avgSlope / (safeAmp * 0.15), 0.5, 2);
      baseCount = Math.round(clamp(baseCount / slopeFactor, 6, 30));
    }

    const levels: ContourLevel[] = [];

    const colorStops = [
      { t: 0.0, h: 220, s: 0.6, l: 0.28 },
      { t: 0.2, h: 200, s: 0.5, l: 0.42 },
      { t: 0.4, h: 110, s: 0.35, l: 0.48 },
      { t: 0.55, h: 60, s: 0.3, l: 0.52 },
      { t: 0.7, h: 35, s: 0.45, l: 0.48 },
      { t: 0.85, h: 25, s: 0.35, l: 0.55 },
      { t: 1.0, h: 210, s: 0.08, l: 0.88 },
    ];

    const getColorAtRatio = (ratio: number) => {
      const r = clamp(ratio, 0, 1);
      for (let i = 0; i < colorStops.length - 1; i++) {
        const s1 = colorStops[i];
        const s2 = colorStops[i + 1];
        if (r >= s1.t && r <= s2.t) {
          const localT = (r - s1.t) / (s2.t - s1.t);
          const h = lerp(s1.h, s2.h, localT);
          const s = lerp(s1.s, s2.s, localT);
          const l = lerp(s1.l, s2.l, localT);
          return hslToRgb(h / 360, s, l);
        }
      }
      return hslToRgb(colorStops[colorStops.length - 1].h / 360, colorStops[colorStops.length - 1].s, colorStops[colorStops.length - 1].l);
    };

    const step = range / (baseCount - 1);

    for (let i = 0; i < baseCount; i++) {
      const height = minH + i * step;
      const ratio = i / (baseCount - 1);
      const rgb = getColorAtRatio(ratio);

      const grayMix = 0.35;
      const grayVal = Math.round(70 + ratio * 120);
      const r = Math.round(rgb.r * (1 - grayMix) + grayVal * grayMix);
      const g = Math.round(rgb.g * (1 - grayMix) + grayVal * grayMix);
      const b = Math.round(rgb.b * (1 - grayMix) + (grayVal + 8) * grayMix);

      levels.push({
        height,
        color: `rgb(${clamp(r, 40, 230)}, ${clamp(g, 40, 230)}, ${clamp(b, 45, 240)})`,
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

export function easeOutBack(t: number): number {
  try {
    const safeT = clamp(isFinite(t) ? t : 0, 0, 1);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(safeT - 1, 3) + c1 * Math.pow(safeT - 1, 2);
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
