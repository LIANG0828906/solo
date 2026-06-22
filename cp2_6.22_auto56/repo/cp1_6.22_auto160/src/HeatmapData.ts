export interface DensityPoint {
  x: number;
  y: number;
  density: number;
}

export function generateDensityPoints(count: number = 2000): DensityPoint[] {
  const points: DensityPoint[] = [];
  const half = 25;

  const clusterCenters = [
    { x: -10, y: -8, intensity: 0.9 },
    { x: 8, y: 12, intensity: 0.85 },
    { x: 15, y: -10, intensity: 0.8 },
    { x: -15, y: 10, intensity: 0.75 },
    { x: 0, y: 0, intensity: 1.0 },
  ];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 2 - 1) * half;
    const y = (Math.random() * 2 - 1) * half;

    let clusterFactor = 0;
    for (const c of clusterCenters) {
      const dx = x - c.x;
      const dy = y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      clusterFactor += c.intensity * Math.exp(-dist / 12);
    }

    const randomBase = Math.random() * 100;
    const density = Math.min(100, Math.max(0, randomBase * 0.35 + clusterFactor * 65));

    points.push({
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      density: parseFloat(density.toFixed(2)),
    });
  }

  return points;
}

export const MAP_SIZE = 50;
export const GRID_UNIT = 2;
export const GRID_CELLS = MAP_SIZE / GRID_UNIT;
