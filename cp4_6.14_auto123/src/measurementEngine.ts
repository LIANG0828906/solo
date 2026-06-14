import * as THREE from 'three';

export interface MeasurementResult {
  pathLength: number;
  avgDiameter: number;
}

export function calculatePathLength(points: THREE.Vector3[]): number {
  if (points.length < 2) return 0;
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += points[i - 1].distanceTo(points[i]);
  }
  return Math.round(totalLength * 100) / 100;
}

function leastSquaresCircleFit(projectedPoints: THREE.Vector3[]): number {
  const n = projectedPoints.length;
  if (n < 3) return 0;

  let sumX = 0, sumY = 0;
  for (const p of projectedPoints) {
    sumX += p.x;
    sumY += p.y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let sumXX = 0, sumYY = 0, sumXY = 0, sumXXX = 0, sumYYY = 0, sumXXY = 0, sumXYY = 0;
  for (const p of projectedPoints) {
    const xi = p.x - meanX;
    const yi = p.y - meanY;
    sumXX += xi * xi;
    sumYY += yi * yi;
    sumXY += xi * yi;
    sumXXX += xi * xi * xi;
    sumYYY += yi * yi * yi;
    sumXXY += xi * xi * yi;
    sumXYY += xi * yi * yi;
  }

  const A = n * sumXX - sumX * sumX + n * sumYY - sumY * sumY;
  const det = sumXX * sumYY - sumXY * sumXY;

  if (Math.abs(det) < 1e-10) return 0;

  const B1 = 0.5 * (n * (sumXXX + sumXYY) - sumX * (sumXX + sumYY));
  const B2 = 0.5 * (n * (sumXXY + sumYYY) - sumY * (sumXX + sumYY));

  const a = (sumYY * B1 - sumXY * B2) / det;
  const b = (sumXX * B2 - sumXY * B1) / det;

  let sumR2 = 0;
  for (const p of projectedPoints) {
    const dx = p.x - meanX - a;
    const dy = p.y - meanY - b;
    sumR2 += dx * dx + dy * dy;
  }

  const radius = Math.sqrt(sumR2 / n);
  return radius * 2;
}

export function calculateAvgDiameter(
  pathPoints: THREE.Vector3[],
  allCloudPoints: THREE.Vector3[]
): number {
  if (pathPoints.length < 2) return 0;

  const crossSectionInterval = 0.3;
  const totalPathLength = calculatePathLength(pathPoints);
  if (totalPathLength < crossSectionInterval) {
    return fitSingleCrossSection(pathPoints, allCloudPoints);
  }

  const numSections = Math.max(1, Math.floor(totalPathLength / crossSectionInterval));
  const diameters: number[] = [];

  for (let s = 0; s < numSections; s++) {
    const targetDist = (s + 0.5) * crossSectionInterval;
    const { position, direction } = getPointAtDistance(pathPoints, targetDist);
    if (!position || !direction) continue;

    const perpPlane = new THREE.Plane();
    perpPlane.setFromNormalAndCoplanarPoint(direction, position);

    const projected = projectNearbyPoints(allCloudPoints, perpPlane, position, direction, 20);
    if (projected.length >= 3) {
      const diameter = leastSquaresCircleFit(projected);
      if (diameter > 0 && diameter < 2) {
        diameters.push(diameter);
      }
    }
  }

  if (diameters.length === 0) {
    return fitSingleCrossSection(pathPoints, allCloudPoints);
  }

  const avgDiam = diameters.reduce((a, b) => a + b, 0) / diameters.length;
  return Math.round(avgDiam * 100) / 100;
}

function fitSingleCrossSection(
  pathPoints: THREE.Vector3[],
  allCloudPoints: THREE.Vector3[]
): number {
  const midIdx = Math.floor(pathPoints.length / 2);
  const position = pathPoints[midIdx].clone();
  let direction: THREE.Vector3;
  if (midIdx > 0) {
    direction = pathPoints[midIdx].clone().sub(pathPoints[midIdx - 1]).normalize();
  } else if (pathPoints.length > 1) {
    direction = pathPoints[1].clone().sub(pathPoints[0]).normalize();
  } else {
    return 0;
  }

  const perpPlane = new THREE.Plane();
  perpPlane.setFromNormalAndCoplanarPoint(direction, position);

  const projected = projectNearbyPoints(allCloudPoints, perpPlane, position, direction, 20);
  if (projected.length < 3) return 0;
  const d = leastSquaresCircleFit(projected);
  return Math.round(d * 100) / 100;
}

function getPointAtDistance(
  pathPoints: THREE.Vector3[],
  distance: number
): { position: THREE.Vector3 | null; direction: THREE.Vector3 | null } {
  let accumulated = 0;
  for (let i = 1; i < pathPoints.length; i++) {
    const segLen = pathPoints[i - 1].distanceTo(pathPoints[i]);
    if (accumulated + segLen >= distance) {
      const t = segLen > 0 ? (distance - accumulated) / segLen : 0;
      const position = new THREE.Vector3().lerpVectors(pathPoints[i - 1], pathPoints[i], t);
      const direction = pathPoints[i].clone().sub(pathPoints[i - 1]).normalize();
      return { position, direction };
    }
    accumulated += segLen;
  }
  return { position: null, direction: null };
}

function projectNearbyPoints(
  allPoints: THREE.Vector3[],
  plane: THREE.Plane,
  center: THREE.Vector3,
  normal: THREE.Vector3,
  count: number
): THREE.Vector3[] {
  const dists: { point: THREE.Vector3; planeDist: number }[] = [];

  for (const p of allPoints) {
    const planeDist = Math.abs(plane.distanceToPoint(p));
    const spatialDist = p.distanceTo(center);
    if (spatialDist < 0.5) {
      dists.push({ point: p, planeDist });
    }
  }

  dists.sort((a, b) => a.planeDist - b.planeDist);
  const nearest = dists.slice(0, count);

  if (nearest.length < 3) return [];

  const u = new THREE.Vector3();
  if (Math.abs(normal.x) < 0.9) {
    u.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
  } else {
    u.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
  }
  const v = new THREE.Vector3().crossVectors(normal, u).normalize();

  return nearest.map(({ point }) => {
    const diff = point.clone().sub(center);
    return new THREE.Vector3(diff.dot(u), diff.dot(v), 0);
  });
}
