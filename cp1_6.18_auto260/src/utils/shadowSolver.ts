import * as THREE from 'three';

export interface BuildingParams {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

export interface ShadowVertex {
  x: number;
  z: number;
}

const DEG2RAD = Math.PI / 180;

function getSunDirection(sunAltitude: number, sunAzimuth: number): THREE.Vector3 {
  const alt = sunAltitude * DEG2RAD;
  const azi = sunAzimuth * DEG2RAD;
  return new THREE.Vector3(
    Math.cos(alt) * Math.sin(azi),
    Math.sin(alt),
    Math.cos(alt) * Math.cos(azi)
  ).normalize();
}

export function computeShadowPolygon(
  building: BuildingParams,
  sunAltitude: number,
  sunAzimuth: number
): ShadowVertex[] {
  const sunDir = getSunDirection(sunAltitude, sunAzimuth);

  if (sunDir.y <= 0) return [];

  const hw = building.width / 2;
  const hd = building.depth / 2;

  const topCorners = [
    new THREE.Vector3(building.x - hw, building.height, building.z - hd),
    new THREE.Vector3(building.x + hw, building.height, building.z - hd),
    new THREE.Vector3(building.x + hw, building.height, building.z + hd),
    new THREE.Vector3(building.x - hw, building.height, building.z + hd),
  ];

  const shadowPoints: ShadowVertex[] = [];

  for (const corner of topCorners) {
    const t = -corner.y / sunDir.y;
    shadowPoints.push({
      x: corner.x + sunDir.x * t,
      z: corner.z + sunDir.z * t,
    });
  }

  const unique = new Map<string, ShadowVertex>();
  const allPoints = [...shadowPoints,
    { x: building.x - hw, z: building.z - hd },
    { x: building.x + hw, z: building.z - hd },
    { x: building.x + hw, z: building.z + hd },
    { x: building.x - hw, z: building.z + hd },
  ];

  allPoints.forEach((p) => {
    const key = `${p.x.toFixed(2)},${p.z.toFixed(2)}`;
    if (!unique.has(key)) unique.set(key, p);
  });

  return convexHull(Array.from(unique.values()));
}

function convexHull(points: ShadowVertex[]): ShadowVertex[] {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a.x === b.x ? a.z - b.z : a.x - b.x);
  const cross = (o: ShadowVertex, a: ShadowVertex, b: ShadowVertex) =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);

  const lower: ShadowVertex[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: ShadowVertex[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

export function shadowToShape(points: ShadowVertex[]): THREE.Shape {
  const shape = new THREE.Shape();
  if (points.length < 3) return shape;
  shape.moveTo(points[0].x, points[0].z);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].z);
  }
  shape.closePath();
  return shape;
}
