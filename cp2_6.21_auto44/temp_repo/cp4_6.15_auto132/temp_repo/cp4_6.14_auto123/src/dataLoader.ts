export interface PointCloudPoint {
  x: number;
  y: number;
  z: number;
  label: number;
}

export interface PointCloudData {
  points: PointCloudPoint[];
}

export interface NeuronBranch {
  id: number;
  points: PointCloudPoint[];
  label: number;
}

const COLOR_PALETTE = [0x3b82f6, 0x22c55e, 0xf59e0b, 0xef4444, 0x8b5cf6, 0xec4899];

export { COLOR_PALETTE };

function generateBranch(
  branchId: number,
  label: number,
  startPoint: { x: number; y: number; z: number },
  direction: { x: number; y: number; z: number },
  numPoints: number,
  spread: number
): PointCloudPoint[] {
  const points: PointCloudPoint[] = [];
  const dirLen = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
  const nd = {
    x: direction.x / dirLen,
    y: direction.y / dirLen,
    z: direction.z / dirLen,
  };

  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 2.5;
    const radiusFactor = 0.08 * (1 - i / numPoints * 0.4);
    points.push({
      x: startPoint.x + nd.x * t + (Math.random() - 0.5) * radiusFactor * spread,
      y: startPoint.y + nd.y * t + (Math.random() - 0.5) * radiusFactor * spread,
      z: startPoint.z + nd.z * t + (Math.random() - 0.5) * radiusFactor * spread,
      label,
    });
  }
  return points;
}

function generateSampleData(): PointCloudData {
  const branches: { start: { x: number; y: number; z: number }; dir: { x: number; y: number; z: number }; count: number; label: number }[] = [
    { start: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0.3, z: 0.2 }, count: 300, label: 0 },
    { start: { x: 0, y: 0, z: 0 }, dir: { x: -0.5, y: 1, z: 0.1 }, count: 280, label: 1 },
    { start: { x: 0, y: 0, z: 0 }, dir: { x: 0.2, y: -0.4, z: 1 }, count: 260, label: 2 },
    { start: { x: 0, y: 0, z: 0 }, dir: { x: 0.7, y: 0.7, z: -0.5 }, count: 270, label: 3 },
    { start: { x: 0, y: 0, z: 0 }, dir: { x: -0.3, y: -0.2, z: -0.8 }, count: 250, label: 4 },
    { start: { x: 0, y: 0, z: 0 }, dir: { x: 0.4, y: 0.9, z: 0.6 }, count: 290, label: 5 },
    { start: { x: 0, y: 0, z: 0 }, dir: { x: -0.8, y: 0.5, z: 0.3 }, count: 200, label: 0 },
    { start: { x: 0, y: 0, z: 0 }, dir: { x: 0.1, y: -0.7, z: 0.7 }, count: 200, label: 2 },
  ];

  const allPoints: PointCloudPoint[] = [];
  branches.forEach((b) => {
    const pts = generateBranch(0, b.label, b.start, b.dir, b.count, 2.5);
    allPoints.push(...pts);
  });

  return { points: allPoints };
}

export function loadSampleData(): PointCloudData {
  return generateSampleData();
}

export function loadFromJSON(json: string): PointCloudData {
  const data = JSON.parse(json) as PointCloudData;
  return data;
}
