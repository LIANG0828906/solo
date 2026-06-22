import type { Building, ShadowPolygon } from '@/types';

export function calculateSunDirection(timeOfDay: number): {
  direction: [number, number, number];
  elevation: number;
  azimuth: number;
} {
  const normalizedTime = (timeOfDay - 6) / 12;
  const azimuth = Math.PI * (1 - normalizedTime);
  const elevation = Math.sin(normalizedTime * Math.PI) * 0.8 + 0.1;

  const x = Math.cos(azimuth) * Math.cos(elevation);
  const y = Math.sin(elevation);
  const z = Math.sin(azimuth) * Math.cos(elevation);

  return {
    direction: [x, y, z],
    elevation,
    azimuth,
  };
}

export function calculateShadowPolygon(
  building: Building,
  sunDirection: [number, number, number]
): ShadowPolygon {
  const [px, py, pz] = building.position;
  const halfW = building.width / 2;
  const halfD = building.depth / 2;
  const height = building.height;
  const groundY = py - height / 2;

  const topVertices: [number, number, number][] = [
    [px - halfW, py + height / 2, pz - halfD],
    [px + halfW, py + height / 2, pz - halfD],
    [px + halfW, py + height / 2, pz + halfD],
    [px - halfW, py + height / 2, pz + halfD],
  ];

  const [dx, dy, dz] = sunDirection;

  if (dy <= 0.01) {
    return {
      points: [
        [px - halfW, pz - halfD],
        [px + halfW, pz - halfD],
        [px + halfW, pz + halfD],
        [px - halfW, pz + halfD],
      ],
      buildingId: building.id,
    };
  }

  const shadowPoints: [number, number][] = [];
  const t = -groundY / dy;

  for (const [vx, vy, vz] of topVertices) {
    const sx = vx + dx * t;
    const sz = vz + dz * t;
    shadowPoints.push([sx, sz]);
  }

  const bottomPoints: [number, number][] = [
    [px - halfW, pz - halfD],
    [px + halfW, pz - halfD],
    [px + halfW, pz + halfD],
    [px - halfW, pz + halfD],
  ];

  const allPoints = [...shadowPoints, ...bottomPoints];

  const hull = convexHull(allPoints);

  return {
    points: hull,
    buildingId: building.id,
  };
}

function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 1) return points;

  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

function cross(
  o: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

export function calculateAllShadows(
  buildings: Building[],
  timeOfDay: number
): ShadowPolygon[] {
  const { direction } = calculateSunDirection(timeOfDay);
  return buildings.map((b) => calculateShadowPolygon(b, direction));
}
