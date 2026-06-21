import { Dataset, PointData, DatasetType } from '../types';

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const generatePointCloud = (
  count: number,
  seed: number,
  type: DatasetType,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }
): PointData[] => {
  const random = seededRandom(seed);
  const points: PointData[] = [];
  const { minX, maxX, minZ, maxZ, minY, maxY } = bounds;

  for (let i = 0; i < count; i++) {
    const lon = minX + random() * (maxX - minX);
    const lat = minZ + random() * (maxZ - minZ);
    const altitude = minY + random() * (maxY - minY);

    let value: number;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const distFromCenter = Math.sqrt(
      Math.pow((lon - centerX) / (maxX - minX), 2) +
      Math.pow((lat - centerZ) / (maxZ - minZ), 2)
    );

    switch (type) {
      case 'temperature':
        value = 35 - distFromCenter * 50 - altitude * 0.03 + (random() - 0.5) * 8;
        break;
      case 'pressure':
        value = 1013 - distFromCenter * 60 - altitude * 0.1 + (random() - 0.5) * 15;
        break;
      case 'wind':
        value = 2 + distFromCenter * 25 + altitude * 0.05 + (random() - 0.5) * 10;
        break;
      default:
        value = random() * 50;
    }

    points.push({
      id: `${type}-${i}`,
      x: lon,
      y: altitude,
      z: lat,
      value: Math.round(value * 10) / 10,
      altitude: Math.round(altitude * 10) / 10,
    });
  }

  return points;
};

export const loadDataset = async (datasetId: string): Promise<Dataset | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  switch (datasetId) {
    case 'global-temperature': {
      const points = generatePointCloud(15000, 42, 'temperature', {
        minX: -180,
        maxX: 180,
        minZ: -90,
        maxZ: 90,
        minY: 0,
        maxY: 15,
      });
      return {
        id: 'global-temperature',
        name: '全球温度场',
        type: 'temperature',
        description: '全球大气温度分布数据（单位：°C）',
        points,
        valueRange: [-20, 40],
      };
    }
    case 'regional-pressure': {
      const points = generatePointCloud(12000, 123, 'pressure', {
        minX: -60,
        maxX: 60,
        minZ: -30,
        maxZ: 60,
        minY: 0,
        maxY: 12,
      });
      return {
        id: 'regional-pressure',
        name: '区域气压场',
        type: 'pressure',
        description: '欧亚大陆区域气压场分布（单位：hPa）',
        points,
        valueRange: [950, 1040],
      };
    }
    case 'ocean-wind': {
      const points = generatePointCloud(18000, 256, 'wind', {
        minX: -150,
        maxX: 150,
        minZ: -70,
        maxZ: 70,
        minY: 0,
        maxY: 10,
      });
      return {
        id: 'ocean-wind',
        name: '海洋洋流风速场',
        type: 'wind',
        description: '全球海洋区域风速分布数据（单位：m/s）',
        points,
        valueRange: [0, 35],
      };
    }
    default:
      return null;
  }
};

export const getAvailableDatasets = () => [
  { id: 'global-temperature', name: '全球温度场', type: 'temperature' as DatasetType },
  { id: 'regional-pressure', name: '区域气压场', type: 'pressure' as DatasetType },
  { id: 'ocean-wind', name: '海洋洋流风速场', type: 'wind' as DatasetType },
];

export const filterByRegion = (
  points: PointData[],
  region: { minX: number; maxX: number; minZ: number; maxZ: number }
): PointData[] => {
  return points.filter(
    (p) =>
      p.x >= region.minX &&
      p.x <= region.maxX &&
      p.z >= region.minZ &&
      p.z <= region.maxZ
  );
};

export const interpolateValueAtPoint = (
  points: PointData[],
  position: [number, number, number],
  radius: number = 5
): number | null => {
  const [x, y, z] = position;
  let weightedSum = 0;
  let weightTotal = 0;

  for (const point of points) {
    const dist = Math.sqrt(
      Math.pow(point.x - x, 2) +
      Math.pow(point.y - y, 2) +
      Math.pow(point.z - z, 2)
    );
    if (dist <= radius) {
      const weight = 1 / (dist + 0.001);
      weightedSum += point.value * weight;
      weightTotal += weight;
    }
  }

  if (weightTotal === 0) return null;
  return Math.round((weightedSum / weightTotal) * 10) / 10;
};

export const extractProfileData = (
  points: PointData[],
  start: [number, number, number],
  end: [number, number, number],
  sampleCount: number = 100
) => {
  const samples: { distance: number; value: number; position: [number, number, number] }[] = [];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const totalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const pos: [number, number, number] = [
      start[0] + dx * t,
      start[1] + dy * t + 3,
      start[2] + dz * t,
    ];
    const value = interpolateValueAtPoint(points, pos, 8) ?? 0;
    samples.push({
      distance: Math.round(totalLength * t * 10) / 10,
      value,
      position: pos,
    });
  }

  return samples;
};
