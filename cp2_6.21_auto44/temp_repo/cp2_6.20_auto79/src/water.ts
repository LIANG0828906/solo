import type { TileHeightMap, FlowParticle } from './types';

export function computeFlowPath(
  heightMap: TileHeightMap,
  startX: number,
  startZ: number
): { x: number; z: number }[] {
  const { size, heights } = heightMap;
  const path: { x: number; z: number }[] = [];

  let x = Math.round(startX);
  let z = Math.round(startZ);

  x = Math.max(0, Math.min(size - 1, x));
  z = Math.max(0, Math.min(size - 1, z));

  const center = (size - 1) / 2;
  path.push({ x: x - center, z: z - center });

  const maxSteps = size * size;
  const visited = new Set<string>();

  for (let step = 0; step < maxSteps; step++) {
    const key = `${x},${z}`;
    if (visited.has(key)) break;
    visited.add(key);

    const currentH = heights[z][x];
    let lowestH = currentH;
    let nextX = x;
    let nextZ = z;

    const neighbors = [
      [0, -1], [0, 1], [-1, 0], [1, 0],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];

    for (const [dx, dz] of neighbors) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
        const nh = heights[nz][nx];
        if (nh < lowestH) {
          lowestH = nh;
          nextX = nx;
          nextZ = nz;
        }
      }
    }

    if (nextX === x && nextZ === z) break;

    x = nextX;
    z = nextZ;
    path.push({ x: x - center, z: z - center });
  }

  return path;
}

export function createParticles(path: { x: number; z: number }[], count: number = 30): FlowParticle[] {
  const particles: FlowParticle[] = [];
  const pathLength = Math.max(1, path.length - 1);

  for (let i = 0; i < count; i++) {
    const progress = (i / count) * pathLength;
    particles.push({
      id: i,
      position: { x: 0, y: 0, z: 0 },
      pathProgress: progress,
      speed: 1.5 + Math.random() * 0.5,
    });
  }

  return particles;
}

export function advanceParticles(
  particles: FlowParticle[],
  path: { x: number; z: number }[],
  heights: number[][],
  delta: number,
  heightScale: number,
  gridSize: number
): FlowParticle[] {
  if (path.length < 2) return particles;

  const pathLength = path.length - 1;
  const center = (gridSize - 1) / 2;

  return particles.map((p) => {
    let progress = p.pathProgress + delta * p.speed * 2;

    if (progress >= pathLength) {
      progress = progress - pathLength;
    }

    const idx = Math.floor(progress);
    const frac = progress - idx;

    const p0 = path[Math.min(idx, path.length - 1)];
    const p1 = path[Math.min(idx + 1, path.length - 1)];

    const x = p0.x + (p1.x - p0.x) * frac;
    const z = p0.z + (p1.z - p0.z) * frac;

    const gridX = Math.round(x + center);
    const gridZ = Math.round(z + center);
    const clampedX = Math.max(0, Math.min(gridSize - 1, gridX));
    const clampedZ = Math.max(0, Math.min(gridSize - 1, gridZ));

    const y = heights[clampedZ][clampedX] * heightScale + 0.15;

    return {
      ...p,
      pathProgress: progress,
      position: { x, y, z },
    };
  });
}
