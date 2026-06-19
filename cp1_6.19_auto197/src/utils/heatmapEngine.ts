import type { Facility, PersonPoint, HeatGrid, MapBounds } from '../types';
import { v4 as uuidv4 } from 'uuid';

const GRID_SIZE = 256;
const BANDWIDTH_METERS = 50;
const METERS_PER_DEGREE_LAT = 111320;

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function metersToLatDelta(meters: number): number {
  return meters / METERS_PER_DEGREE_LAT;
}

function metersToLngDelta(meters: number, lat: number): number {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  return meters / (METERS_PER_DEGREE_LAT * Math.max(cosLat, 0.01));
}

export function generatePersonPoints(
  facilities: Facility[],
  densityFactor: number
): PersonPoint[] {
  const points: PersonPoint[] = [];
  const now = Date.now();

  for (const facility of facilities) {
    const multiplier = 0.5 + Math.random() * 1.5;
    const count = Math.floor(densityFactor * multiplier);

    for (let i = 0; i < count; i++) {
      const offsetLat = gaussianRandom() * metersToLatDelta(BANDWIDTH_METERS * 0.6);
      const offsetLng = gaussianRandom() * metersToLngDelta(BANDWIDTH_METERS * 0.6, facility.lat);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.7;

      points.push({
        id: uuidv4(),
        lat: facility.lat + offsetLat,
        lng: facility.lng + offsetLng,
        originLat: facility.lat,
        originLng: facility.lng,
        weight: 0.5 + Math.random() * 0.5,
        createdAt: now,
        lifespan: 3000,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  return points;
}

export function updatePersonPoints(points: PersonPoint[]): PersonPoint[] {
  const now = Date.now();
  const moveRadiusLat = metersToLatDelta(BANDWIDTH_METERS);

  return points
    .filter((p) => now - p.createdAt < p.lifespan)
    .map((p) => {
      const elapsed = (now - p.createdAt) / p.lifespan;
      const wanderFactor = Math.sin(elapsed * Math.PI) * 0.5;

      let newLat = p.lat + p.vy * metersToLatDelta(0.5) * wanderFactor;
      let newLng = p.lng + p.vx * metersToLngDelta(0.5, p.originLat) * wanderFactor;

      const dLat = newLat - p.originLat;
      const dLng = newLng - p.originLng;
      const distSq = dLat * dLat + dLng * dLng;
      const maxDist = moveRadiusLat * moveRadiusLat * 4;

      if (distSq > maxDist) {
        const dist = Math.sqrt(distSq);
        const scale = Math.sqrt(maxDist) / dist;
        newLat = p.originLat + dLat * scale;
        newLng = p.originLng + dLng * scale;
      }

      return { ...p, lat: newLat, lng: newLng };
    });
}

export function generateHeatGrid(
  points: PersonPoint[],
  bounds: MapBounds
): HeatGrid {
  const data = new Float32Array(GRID_SIZE * GRID_SIZE);
  const latRange = bounds.north - bounds.south;
  const lngRange = bounds.east - bounds.west;

  if (latRange <= 0 || lngRange <= 0 || points.length === 0) {
    return {
      width: GRID_SIZE,
      height: GRID_SIZE,
      data,
      bounds: [bounds.south, bounds.west, bounds.north, bounds.east],
      maxValue: 0,
      avgValue: 0,
      maxPoint: null,
    };
  }

  const sigmaLat = metersToLatDelta(BANDWIDTH_METERS) / latRange;
  const sigmaLng = (metersToLngDelta(BANDWIDTH_METERS, (bounds.north + bounds.south) / 2)) / lngRange;
  const twoSigmaSqLat = 2 * sigmaLat * sigmaLat;
  const twoSigmaSqLng = 2 * sigmaLng * sigmaLng;

  const kernelRadius = 3;
  const radiusY = Math.ceil(sigmaLat * GRID_SIZE * kernelRadius);
  const radiusX = Math.ceil(sigmaLng * GRID_SIZE * kernelRadius);

  let maxValue = 0;
  let sumValue = 0;
  let maxIdx = -1;

  for (const point of points) {
    const normY = (point.lat - bounds.south) / latRange;
    const normX = (point.lng - bounds.west) / lngRange;

    if (normY < 0 || normY > 1 || normX < 0 || normX > 1) continue;

    const gridY = Math.floor(normY * GRID_SIZE);
    const gridX = Math.floor(normX * GRID_SIZE);

    const yStart = Math.max(0, gridY - radiusY);
    const yEnd = Math.min(GRID_SIZE - 1, gridY + radiusY);
    const xStart = Math.max(0, gridX - radiusX);
    const xEnd = Math.min(GRID_SIZE - 1, gridX + radiusX);

    for (let y = yStart; y <= yEnd; y++) {
      const dy = (y / GRID_SIZE) - normY;
      const dySq = dy * dy / twoSigmaSqLat;
      for (let x = xStart; x <= xEnd; x++) {
        const dx = (x / GRID_SIZE) - normX;
        const dxSq = dx * dx / twoSigmaSqLng;
        const influence = point.weight * Math.exp(-(dxSq + dySq));
        const idx = y * GRID_SIZE + x;
        data[idx] += influence;
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i] > maxValue) {
      maxValue = data[i];
      maxIdx = i;
    }
    sumValue += data[i];
  }

  const avgValue = sumValue / data.length;

  let maxPoint = null;
  if (maxIdx >= 0 && maxValue > 0) {
    const y = Math.floor(maxIdx / GRID_SIZE);
    const x = maxIdx % GRID_SIZE;
    maxPoint = {
      lat: bounds.south + (y / GRID_SIZE) * latRange,
      lng: bounds.west + (x / GRID_SIZE) * lngRange,
      value: maxValue,
    };
  }

  return {
    width: GRID_SIZE,
    height: GRID_SIZE,
    data,
    bounds: [bounds.south, bounds.west, bounds.north, bounds.east],
    maxValue,
    avgValue,
    maxPoint,
  };
}

export function getDensityAtPoint(
  grid: HeatGrid | null,
  lat: number,
  lng: number
): number {
  if (!grid || grid.maxValue === 0) return 0;

  const [south, west, north, east] = grid.bounds;
  const latRange = north - south;
  const lngRange = east - west;

  if (latRange <= 0 || lngRange <= 0) return 0;

  const normY = (lat - south) / latRange;
  const normX = (lng - west) / lngRange;

  if (normY < 0 || normY > 1 || normX < 0 || normX > 1) return 0;

  const y = Math.floor(normY * grid.height);
  const x = Math.floor(normX * grid.width);
  const idx = y * grid.width + x;

  return grid.data[idx] / grid.maxValue;
}

export function renderHeatmapToCanvas(
  grid: HeatGrid,
  canvas: HTMLCanvasElement
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = grid.width;
  canvas.height = grid.height;

  const imageData = ctx.createImageData(grid.width, grid.height);
  const pixels = imageData.data;

  const maxVal = grid.maxValue > 0 ? grid.maxValue : 1;

  for (let i = 0; i < grid.data.length; i++) {
    const normalized = Math.min(1, grid.data[i] / maxVal);
    const r = Math.floor(255 * Math.min(1, normalized * 2));
    const g = Math.floor(255 * (normalized < 0.5 ? normalized * 2 : 2 - normalized * 2));
    const b = Math.floor(255 * Math.min(1, (1 - normalized) * 2));
    const a = Math.floor(normalized * 200);

    const pi = i * 4;
    pixels[pi] = r;
    pixels[pi + 1] = g;
    pixels[pi + 2] = b;
    pixels[pi + 3] = a;
  }

  ctx.putImageData(imageData, 0, 0);
}
