import type { GreenArea, TreeData, SchemeData } from '../types';

const MAX_TREES = 300;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pointInPolygon(
  x: number,
  z: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    const intersect =
      zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function getPolygonBounds(polygon: [number, number][]): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (const [x, z] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  return { minX, maxX, minZ, maxZ };
}

function generateTreesForArea(
  area: GreenArea,
  random: () => number,
  remainingSlots: number
): TreeData[] {
  const trees: TreeData[] = [];
  const { minX, maxX, minZ, maxZ } = getPolygonBounds(area.boundary);
  const areaWidth = maxX - minX;
  const areaDepth = maxZ - minZ;
  const totalArea = areaWidth * areaDepth;
  const targetCount = Math.min(
    Math.floor(totalArea * area.coverageRate * 3),
    remainingSlots
  );

  let attempts = 0;
  const maxAttempts = targetCount * 5;

  while (trees.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const x = minX + random() * areaWidth;
    const z = minZ + random() * areaDepth;
    if (!pointInPolygon(x, z, area.boundary)) continue;
    const height = 0.5 + random() * 0.7;
    const crownRadius = 0.3 + random() * 0.5;
    trees.push({
      position: [x, 0, z],
      height,
      crownRadius,
    });
  }
  return trees;
}

export function generateVegetation(scheme: SchemeData): TreeData[] {
  const startTime = performance.now();
  const random = seededRandom(
    scheme.buildings.length + scheme.facilities.length * 7 + scheme.greenAreas.length * 13
  );
  const allTrees: TreeData[] = [];

  for (const area of scheme.greenAreas) {
    if (allTrees.length >= MAX_TREES) break;
    const areaTrees = generateTreesForArea(
      area,
      random,
      MAX_TREES - allTrees.length
    );
    allTrees.push(...areaTrees);
  }

  const elapsed = performance.now() - startTime;
  if (elapsed > 10) {
    console.warn(`Vegetation generation took ${elapsed.toFixed(1)}ms, exceeds 10ms target`);
  }

  return allTrees.slice(0, MAX_TREES);
}
