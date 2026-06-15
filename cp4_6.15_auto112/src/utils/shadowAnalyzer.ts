import { BuildingModel, HeatmapSample, ShadowAnalysisResult } from '../types';
import { calculateSunPosition } from './sunCalculator';

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

  const buildingAABBs = buildings.map((b) => ({
    id: b.id,
    aabb: getBuildingAABB(b),
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

        for (const { id, aabb } of buildingAABBs) {
          if (
            rayAABBIntersect(origin, sunDir, aabb.min, aabb.max)
          ) {
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
