import { BuildingModel, HeatmapSample, ShadowAnalysisResult } from '../types';
import { calculateSunPosition } from './sunCalculator';

export interface BuildingGeometry {
  type: 'box' | 'cone';
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}

function invertRotateVector(v: [number, number, number], angles: [number, number, number]): [number, number, number] {
  const [ax, ay, az] = angles;
  let [x, y, z] = v;

  const cz = Math.cos(az), sz = Math.sin(az);
  let nx = x * cz + y * sz;
  let ny = -x * sz + y * cz;
  x = nx; y = ny;

  const cy = Math.cos(ay), sy = Math.sin(ay);
  nx = x * cy - z * sy;
  let nz = x * sy + z * cy;
  x = nx; z = nz;

  const cx = Math.cos(ax), sx = Math.sin(ax);
  ny = y * cx + z * sx;
  nz = -y * sx + z * cx;
  y = ny; z = nz;

  return [x, y, z];
}

export function getBuildingAABB(building: BuildingModel): {
  min: [number, number, number];
  max: [number, number, number];
} {
  const [px, py, pz] = building.position;
  const [sx, sy, sz] = building.scale;
  const halfWidth = sx / 2;
  const halfDepth = sz / 2;
  return {
    min: [px - halfWidth, py, pz - halfDepth],
    max: [px + halfWidth, py + sy, pz + halfDepth],
  };
}

export function rayAABBIntersect(
  origin: [number, number, number],
  dir: [number, number, number],
  min: [number, number, number],
  max: [number, number, number]
): boolean {
  let tmin = -Infinity;
  let tmax = Infinity;

  for (let i = 0; i < 3; i++) {
    if (Math.abs(dir[i]) < 1e-8) {
      if (origin[i] < min[i] || origin[i] > max[i]) {
        return false;
      }
    } else {
      const t1 = (min[i] - origin[i]) / dir[i];
      const t2 = (max[i] - origin[i]) / dir[i];
      const tlow = Math.min(t1, t2);
      const thigh = Math.max(t1, t2);
      tmin = Math.max(tmin, tlow);
      tmax = Math.min(tmax, thigh);
      if (tmin > tmax) {
        return false;
      }
    }
  }

  return tmax >= 0 && tmin <= tmax;
}

export function getBuildingGeometry(model: BuildingModel): BuildingGeometry[] {
  const geometries: BuildingGeometry[] = [];
  const [, height, depth] = model.scale;

  switch (model.modelType) {
    case 'skyscraper': {
      const layers = 8;
      for (let i = 0; i < layers; i++) {
        const ratio = 1 - (i / layers) * 0.3;
        const layerHeight = height / layers;
        geometries.push({
          type: 'box',
          position: [0, i * layerHeight + layerHeight / 2, 0],
          size: [model.scale[0] * ratio, layerHeight, depth * ratio],
        });
      }
      break;
    }
    case 'villa': {
      const mainHeight = height * 0.6;
      const roofHeight = height * 0.4;
      geometries.push({
        type: 'box',
        position: [0, mainHeight / 2, 0],
        size: [model.scale[0], mainHeight, depth],
      });
      geometries.push({
        type: 'cone',
        position: [0, mainHeight + roofHeight / 2, 0],
        size: [model.scale[0], roofHeight, depth],
      });
      break;
    }
    case 'complex': {
      const boxes = [
        { pos: [0, height * 0.3, 0] as [number, number, number], size: [model.scale[0] * 0.8, height * 0.6, depth * 0.8] as [number, number, number] },
        { pos: [model.scale[0] * 0.3, height * 0.5, 0] as [number, number, number], size: [model.scale[0] * 0.4, height * 0.7, depth * 0.7] as [number, number, number] },
        { pos: [-model.scale[0] * 0.25, height * 0.4, depth * 0.2] as [number, number, number], size: [model.scale[0] * 0.35, height * 0.5, depth * 0.5] as [number, number, number] },
        { pos: [0, height * 0.75, -depth * 0.15] as [number, number, number], size: [model.scale[0] * 0.3, height * 0.35, depth * 0.4] as [number, number, number] },
      ];
      for (const box of boxes) {
        geometries.push({
          type: 'box',
          position: box.pos,
          size: box.size,
        });
      }
      break;
    }
    case 'custom':
    default:
      geometries.push({
        type: 'box',
        position: [0, height / 2, 0],
        size: [model.scale[0], height, depth],
      });
      break;
  }

  return geometries;
}

export function transformRayToLocalSpace(
  origin: [number, number, number],
  dir: [number, number, number],
  buildingPosition: [number, number, number],
  buildingRotation: [number, number, number]
): { localOrigin: [number, number, number]; localDir: [number, number, number] } {
  const translatedOrigin: [number, number, number] = [
    origin[0] - buildingPosition[0],
    origin[1] - buildingPosition[1],
    origin[2] - buildingPosition[2],
  ];

  const localOrigin = invertRotateVector(translatedOrigin, buildingRotation);
  const localDir = invertRotateVector(dir, buildingRotation);

  return { localOrigin, localDir };
}

export function rayBoxIntersect(
  origin: [number, number, number],
  dir: [number, number, number],
  boxMin: [number, number, number],
  boxMax: [number, number, number]
): number | null {
  let tmin = -Infinity;
  let tmax = Infinity;

  for (let i = 0; i < 3; i++) {
    if (Math.abs(dir[i]) < 1e-8) {
      if (origin[i] < boxMin[i] || origin[i] > boxMax[i]) {
        return null;
      }
    } else {
      const t1 = (boxMin[i] - origin[i]) / dir[i];
      const t2 = (boxMax[i] - origin[i]) / dir[i];
      const tlow = Math.min(t1, t2);
      const thigh = Math.max(t1, t2);
      tmin = Math.max(tmin, tlow);
      tmax = Math.min(tmax, thigh);
      if (tmin > tmax) {
        return null;
      }
    }
  }

  if (tmax < 0) {
    return null;
  }

  return Math.max(tmin, 0);
}

function rayTriangleIntersect(
  origin: [number, number, number],
  dir: [number, number, number],
  v0: [number, number, number],
  v1: [number, number, number],
  v2: [number, number, number]
): number | null {
  const edge1: [number, number, number] = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
  const edge2: [number, number, number] = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

  const h: [number, number, number] = [
    dir[1] * edge2[2] - dir[2] * edge2[1],
    dir[2] * edge2[0] - dir[0] * edge2[2],
    dir[0] * edge2[1] - dir[1] * edge2[0],
  ];

  const a = edge1[0] * h[0] + edge1[1] * h[1] + edge1[2] * h[2];

  if (Math.abs(a) < 1e-8) {
    return null;
  }

  const f = 1.0 / a;
  const s: [number, number, number] = [
    origin[0] - v0[0],
    origin[1] - v0[1],
    origin[2] - v0[2],
  ];

  const u = f * (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]);
  if (u < 0 || u > 1) {
    return null;
  }

  const q: [number, number, number] = [
    s[1] * edge1[2] - s[2] * edge1[1],
    s[2] * edge1[0] - s[0] * edge1[2],
    s[0] * edge1[1] - s[1] * edge1[0],
  ];

  const v = f * (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]);
  if (v < 0 || u + v > 1) {
    return null;
  }

  const t = f * (edge2[0] * q[0] + edge2[1] * q[1] + edge2[2] * q[2]);
  return t > 1e-8 ? t : null;
}

export function rayConeIntersect(
  origin: [number, number, number],
  dir: [number, number, number],
  coneHeight: number,
  coneRadius: number,
  segments: number = 4
): number | null {
  const halfHeight = coneHeight / 2;
  const apex: [number, number, number] = [0, halfHeight, 0];
  const baseY = -halfHeight;

  const angleStep = (Math.PI * 2) / segments;
  const baseVertices: [number, number, number][] = [];

  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;
    baseVertices.push([
      Math.cos(angle) * coneRadius,
      baseY,
      Math.sin(angle) * coneRadius,
    ]);
  }

  let minT: number | null = null;

  for (let i = 0; i < segments; i++) {
    const v1 = baseVertices[i];
    const v2 = baseVertices[(i + 1) % segments];
    const t = rayTriangleIntersect(origin, dir, apex, v1, v2);
    if (t !== null && (minT === null || t < minT)) {
      minT = t;
    }
  }

  for (let i = 2; i < segments; i++) {
    const t = rayTriangleIntersect(origin, dir, baseVertices[0], baseVertices[i - 1], baseVertices[i]);
    if (t !== null && (minT === null || t < minT)) {
      minT = t;
    }
  }

  return minT;
}

function rayBuildingIntersect(
  origin: [number, number, number],
  dir: [number, number, number],
  building: BuildingModel
): boolean {
  const aabb = getBuildingAABB(building);
  if (!rayAABBIntersect(origin, dir, aabb.min, aabb.max)) {
    return false;
  }

  const { localOrigin, localDir } = transformRayToLocalSpace(
    origin,
    dir,
    building.position,
    building.rotation
  );

  const geometries = getBuildingGeometry(building);
  let hasIntersection = false;

  for (const geom of geometries) {
    const [gx, gy, gz] = geom.position;
    const [w, h, d] = geom.size;
    const halfW = w / 2;
    const halfH = h / 2;
    const halfD = d / 2;

    const geomOrigin: [number, number, number] = [
      localOrigin[0] - gx,
      localOrigin[1] - gy,
      localOrigin[2] - gz,
    ];

    if (geom.type === 'box') {
      const boxMin: [number, number, number] = [-halfW, -halfH, -halfD];
      const boxMax: [number, number, number] = [halfW, halfH, halfD];
      const t = rayBoxIntersect(geomOrigin, localDir, boxMin, boxMax);
      if (t !== null && t > 1e-6) {
        hasIntersection = true;
      }
    } else if (geom.type === 'cone') {
      const t = rayConeIntersect(geomOrigin, localDir, h, halfW, 4);
      if (t !== null && t > 1e-6) {
        hasIntersection = true;
      }
    }
  }

  return hasIntersection;
}

export function analyzeShadows(
  buildings: BuildingModel[],
  dayOfYear: number,
  latitude: number,
  longitude: number,
  gridSize: number,
  sampleResolution: number,
  onProgress?: (progress: number) => void
): ShadowAnalysisResult {
  const timePoints: number[] = [];
  for (let hour = 6; hour <= 19; hour += 0.5) {
    timePoints.push(hour);
  }

  const samples: HeatmapSample[][] = [];
  const halfGrid = gridSize / 2;
  const step = gridSize / (sampleResolution - 1);

  for (let i = 0; i < sampleResolution; i++) {
    const row: HeatmapSample[] = [];
    for (let j = 0; j < sampleResolution; j++) {
      const x = -halfGrid + i * step;
      const z = -halfGrid + j * step;
      row.push({
        x,
        z,
        sunlightHours: 0,
        shadowCount: 0,
        isShadowedBy: [],
      });
    }
    samples.push(row);
  }

  const buildingData = buildings.map((b) => ({
    id: b.id,
    building: b,
  }));

  const totalSteps = timePoints.length * sampleResolution * sampleResolution;
  let completedSteps = 0;

  for (let t = 0; t < timePoints.length; t++) {
    const hour = timePoints[t];
    const sunPos = calculateSunPosition(dayOfYear, hour, latitude, longitude);
    const sunDir = sunPos.directionVector;

    if (sunPos.altitude <= 0) {
      completedSteps += sampleResolution * sampleResolution;
      continue;
    }

    for (let i = 0; i < sampleResolution; i++) {
      for (let j = 0; j < sampleResolution; j++) {
        const sample = samples[i][j];
        const origin: [number, number, number] = [sample.x, 0.01, sample.z];
        let shadowedCount = 0;
        const shadowedBy: string[] = [];

        for (const { id, building } of buildingData) {
          if (rayBuildingIntersect(origin, sunDir, building)) {
            shadowedCount++;
            shadowedBy.push(id);
          }
        }

        if (shadowedCount === 0) {
          sample.sunlightHours += 0.5;
        } else {
          sample.shadowCount++;
          if (t === 0 || sample.isShadowedBy.length === 0) {
            sample.isShadowedBy = shadowedBy;
          } else {
            for (const bid of shadowedBy) {
              if (!sample.isShadowedBy.includes(bid)) {
                sample.isShadowedBy.push(bid);
              }
            }
          }
        }

        completedSteps++;
        if (onProgress && completedSteps % 100 === 0) {
          onProgress(completedSteps / totalSteps);
        }
      }
    }
  }

  const totalSamplePoints = sampleResolution * sampleResolution;
  let totalSunlightHours = 0;
  let shadowedPoints = 0;
  let overlapPoints = 0;
  let maxSunlightHours = 0;
  let minSunlightHours = Infinity;

  for (let i = 0; i < sampleResolution; i++) {
    for (let j = 0; j < sampleResolution; j++) {
      const sample = samples[i][j];
      totalSunlightHours += sample.sunlightHours;
      if (sample.shadowCount > 0) {
        shadowedPoints++;
      }
      if (sample.isShadowedBy.length >= 2) {
        overlapPoints++;
      }
      if (sample.sunlightHours > maxSunlightHours) {
        maxSunlightHours = sample.sunlightHours;
      }
      if (sample.sunlightHours < minSunlightHours) {
        minSunlightHours = sample.sunlightHours;
      }
    }
  }

  const avgSunlightHours = totalSunlightHours / totalSamplePoints;
  const shadowCoveragePercent = (shadowedPoints / totalSamplePoints) * 100;
  const overlapPercent = (overlapPoints / totalSamplePoints) * 100;

  if (onProgress) {
    onProgress(1);
  }

  return {
    samples,
    totalSamplePoints,
    avgSunlightHours,
    shadowCoveragePercent,
    maxSunlightHours,
    minSunlightHours: minSunlightHours === Infinity ? 0 : minSunlightHours,
    overlapPercent: buildings.length >= 2 ? overlapPercent : undefined,
    isComputing: false,
    progress: 1,
  };
}
