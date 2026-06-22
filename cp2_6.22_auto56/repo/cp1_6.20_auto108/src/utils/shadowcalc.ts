import * as THREE from 'three';
import type {
  BuildingConfig,
  ShadowData,
  ShadowPointData,
  TimeSlot,
} from '../types';
import { GRID_RESOLUTION, GRID_SIZE } from '../types';
import { getSunPosition } from './suncalc';

function getBuildingVertices(config: BuildingConfig): THREE.Vector3[] {
  const hl = config.length / 2;
  const hw = config.width / 2;
  const h = config.floors * config.floorHeight;
  return [
    new THREE.Vector3(-hl, 0, -hw),
    new THREE.Vector3(hl, 0, -hw),
    new THREE.Vector3(hl, 0, hw),
    new THREE.Vector3(-hl, 0, hw),
    new THREE.Vector3(-hl, h, -hw),
    new THREE.Vector3(hl, h, -hw),
    new THREE.Vector3(hl, h, hw),
    new THREE.Vector3(-hl, h, hw),
  ];
}

function projectPointToGround(
  point: THREE.Vector3,
  sunDir: THREE.Vector3
): THREE.Vector3 {
  const t = -point.y / (sunDir.y || 1e-9);
  if (t < 0) return new THREE.Vector3(point.x, 0, point.z);
  return new THREE.Vector3(
    point.x + sunDir.x * t,
    0,
    point.z + sunDir.z * t
  );
}

function convexHull2D(points: THREE.Vector3[]): THREE.Vector3[] {
  if (points.length < 3) return [...points];

  const sorted = [...points].sort((a, b) =>
    a.x === b.x ? a.z - b.z : a.x - b.x
  );

  const cross = (o: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);

  const lower: THREE.Vector3[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: THREE.Vector3[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
      upper.pop();
    }
    upper.push(sorted[i]);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function pointInPolygon(px: number, pz: number, polygon: THREE.Vector3[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const zi = polygon[i].z;
    const xj = polygon[j].x;
    const zj = polygon[j].z;
    const intersect =
      zi > pz !== zj > pz &&
      px < ((xj - xi) * (pz - zi)) / (zj - zi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function computeShadowPolygon(
  config: BuildingConfig,
  sunDir: THREE.Vector3
): THREE.Vector3[] {
  const vertices = getBuildingVertices(config);
  if (sunDir.y >= 0) return [];
  const projected = vertices.map((v) => projectPointToGround(v, sunDir));
  return convexHull2D(projected);
}

export function computeShadowTip(
  config: BuildingConfig,
  sunDir: THREE.Vector3
): THREE.Vector3 | null {
  if (sunDir.y >= 0) return null;
  const h = config.floors * config.floorHeight;
  const topCenter = new THREE.Vector3(0, h, 0);
  return projectPointToGround(topCenter, sunDir);
}

export function computeShadowTrail(
  config: BuildingConfig,
  date: Date,
  lat: number,
  lon: number,
  startHour = 6,
  endHour = 18,
  step = 0.25
): THREE.Vector3[] {
  const trail: THREE.Vector3[] = [];
  for (let h = startHour; h <= endHour; h += step) {
    const sun = getSunPosition(date, h, lat, lon);
    const tip = computeShadowTip(config, sun.direction);
    if (tip) trail.push(tip);
  }
  return trail;
}

export function computePointTimeSlots(
  x: number,
  z: number,
  config: BuildingConfig,
  date: Date,
  lat: number,
  lon: number,
  startHour = 6,
  endHour = 18,
  step = 0.1
): { slots: TimeSlot[]; ratio: number } {
  const timeline: { hour: number; inShadow: boolean }[] = [];
  let shadowHours = 0;
  let totalHours = 0;

  for (let h = startHour; h <= endHour; h += step) {
    const sun = getSunPosition(date, h, lat, lon);
    let inShadow = false;
    if (sun.altitude > 0) {
      const poly = computeShadowPolygon(config, sun.direction);
      inShadow = pointInPolygon(x, z, poly);
      totalHours += step;
      if (inShadow) shadowHours += step;
    }
    timeline.push({ hour: h, inShadow });
  }

  const slots: TimeSlot[] = [];
  if (timeline.length === 0) return { slots, ratio: 0 };

  let currentInShadow = timeline[0].inShadow;
  let slotStart = timeline[0].hour;

  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].inShadow !== currentInShadow) {
      slots.push({
        startHour: slotStart,
        endHour: timeline[i - 1].hour + step,
        inShadow: currentInShadow,
      });
      currentInShadow = timeline[i].inShadow;
      slotStart = timeline[i].hour;
    }
  }

  slots.push({
    startHour: slotStart,
    endHour: endHour,
    inShadow: currentInShadow,
  });

  const ratio = totalHours > 0 ? shadowHours / totalHours : 0;
  return { slots, ratio };
}

export function computeHeatmap(
  config: BuildingConfig,
  date: Date,
  lat: number,
  lon: number,
  size = GRID_SIZE,
  resolution = GRID_RESOLUTION
): ShadowPointData[][] {
  const grid: ShadowPointData[][] = [];
  const half = size / 2;
  const cellSize = size / resolution;

  for (let i = 0; i < resolution; i++) {
    const row: ShadowPointData[] = [];
    for (let j = 0; j < resolution; j++) {
      const x = -half + (i + 0.5) * cellSize;
      const z = -half + (j + 0.5) * cellSize;
      const { slots, ratio } = computePointTimeSlots(
        x,
        z,
        config,
        date,
        lat,
        lon,
        6,
        18,
        0.5
      );
      row.push({ x, z, shadowCoverageRatio: ratio, timeSlots: slots });
    }
    grid.push(row);
  }
  return grid;
}

export function computeIsochrons(
  heatmap: ShadowPointData[][],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  levels: number[] = [0.2, 0.4, 0.6, 0.8]
): { level: number; points: THREE.Vector3[] }[] {
  const result: { level: number; points: THREE.Vector3[] }[] = [];
  const resolution = heatmap.length;
  if (resolution === 0) return result;

  for (const level of levels) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < resolution - 1; i += 2) {
      for (let j = 0; j < resolution - 1; j += 2) {
        const d = heatmap[i][j].shadowCoverageRatio;
        if (Math.abs(d - level) < 0.08) {
          const { minX, maxX, minZ, maxZ } = bounds;
          const x = minX + ((maxX - minX) * i) / (resolution - 1);
          const z = minZ + ((maxZ - minZ) * j) / (resolution - 1);
          pts.push(new THREE.Vector3(x, 0.02, z));
        }
      }
    }
    if (pts.length >= 2) {
      result.push({ level, points: pts });
    }
  }
  return result;
}

export function computeAllShadowData(
  config: BuildingConfig,
  date: Date,
  currentHour: number,
  lat: number,
  lon: number,
  size = GRID_SIZE,
  resolution = Math.round(GRID_RESOLUTION / 2)
): ShadowData {
  const sun = getSunPosition(date, currentHour, lat, lon);
  const shadowPolygon = computeShadowPolygon(config, sun.direction);
  const shadowTrail = computeShadowTrail(config, date, lat, lon);
  const heatmapGrid = computeHeatmap(config, date, lat, lon, size, resolution);
  const half = size / 2;
  const bounds = { minX: -half, maxX: half, minZ: -half, maxZ: half };
  const isochrons = computeIsochrons(heatmapGrid, bounds);

  return {
    shadowPolygon,
    shadowTrail,
    isochrons,
    heatmapGrid,
    gridSize: size,
    gridBounds: bounds,
  };
}

export function lookupPointInfo(
  heatmap: ShadowPointData[][],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  x: number,
  z: number
): ShadowPointData | null {
  const resolution = heatmap.length;
  if (resolution === 0) return null;
  const i = Math.round(((x - bounds.minX) / (bounds.maxX - bounds.minX)) * (resolution - 1));
  const j = Math.round(((z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * (resolution - 1));
  if (i < 0 || i >= resolution || j < 0 || j >= resolution) return null;
  return heatmap[i][j];
}
