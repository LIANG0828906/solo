export interface NoiseDataPoint {
  x: number;
  z: number;
  groundDb: number;
  height10Db: number;
  height20Db: number;
  height30Db: number;
  districtId: string;
}

export interface District {
  id: string;
  name: string;
  description: string;
  groundColor: number;
  data: NoiseDataPoint[];
}

export type PerformanceMode = 'performance' | 'quality';

export interface NoiseRating {
  level: string;
  color: string;
}

export function getNoiseRating(db: number): NoiseRating {
  if (db < 55) return { level: '安静', color: '#4caf50' };
  if (db < 70) return { level: '中等', color: '#ffeb3b' };
  if (db < 85) return { level: '吵闹', color: '#ff9800' };
  return { level: '极吵', color: '#f44336' };
}

function generateGridData(
  districtId: string,
  gridSize: number,
  spacing: number,
  baseNoise: number,
  variance: number,
  heightDecay: number
): NoiseDataPoint[] {
  const data: NoiseDataPoint[] = [];
  const offset = (gridSize - 1) * spacing / 2;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = i * spacing - offset;
      const z = j * spacing - offset;
      const distFromCenter = Math.sqrt(x * x + z * z);
      const centerFactor = Math.max(0, 1 - distFromCenter / (offset * 1.5));

      const randomFactor = Math.random() * variance;
      const groundDb = baseNoise + randomFactor + centerFactor * 15;
      const height10Db = groundDb - heightDecay * (1 + Math.random() * 0.3);
      const height20Db = height10Db - heightDecay * (1 + Math.random() * 0.3);
      const height30Db = height20Db - heightDecay * (1 + Math.random() * 0.3);

      data.push({
        x,
        z,
        groundDb: Math.round(groundDb * 10) / 10,
        height10Db: Math.round(height10Db * 10) / 10,
        height20Db: Math.round(height20Db * 10) / 10,
        height30Db: Math.round(height30Db * 10) / 10,
        districtId
      });
    }
  }
  return data;
}

function generateSunkenPlazaData(): NoiseDataPoint[] {
  const data: NoiseDataPoint[] = [];
  const districtId = 'sunken-plaza';

  for (let ring = 0; ring < 4; ring++) {
    const radius = ring * 4 + 2;
    const pointsInRing = ring === 0 ? 1 : ring * 8;
    for (let i = 0; i < pointsInRing; i++) {
      const angle = (i / pointsInRing) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const ringFactor = ring === 0 ? 0.8 : 1 - ring * 0.15;
      const baseNoise = 55 + ringFactor * 20;
      const randomFactor = (Math.random() - 0.5) * 8;

      const groundDb = baseNoise + randomFactor;
      const decay = 3 + ring * 0.5;

      data.push({
        x: Math.round(x * 10) / 10,
        z: Math.round(z * 10) / 10,
        groundDb: Math.round(groundDb * 10) / 10,
        height10Db: Math.round((groundDb - decay) * 10) / 10,
        height20Db: Math.round((groundDb - decay * 1.8) * 10) / 10,
        height30Db: Math.round((groundDb - decay * 2.5) * 10) / 10,
        districtId
      });
    }
  }
  return data;
}

function generateCommercialStreetData(): NoiseDataPoint[] {
  const data: NoiseDataPoint[] = [];
  const districtId = 'commercial-street';
  const streetLength = 40;
  const streetWidth = 8;
  const spacing = 4;

  for (let x = -streetLength / 2; x <= streetLength / 2; x += spacing) {
    for (let zOffset = -streetWidth; zOffset <= streetWidth; zOffset += spacing / 2) {
      const z = zOffset;
      const distFromStreet = Math.abs(z);
      const streetFactor = Math.max(0, 1 - distFromStreet / (streetWidth * 1.5));
      const crowdFactor = Math.abs(x) < streetLength * 0.3 ? 1.2 : 0.9;

      const baseNoise = 60 + streetFactor * 20 * crowdFactor;
      const randomFactor = (Math.random() - 0.5) * 10;
      const groundDb = baseNoise + randomFactor;
      const decay = 2.5 + streetFactor * 2;

      data.push({
        x: Math.round(x * 10) / 10,
        z: Math.round(z * 10) / 10,
        groundDb: Math.round(groundDb * 10) / 10,
        height10Db: Math.round((groundDb - decay) * 10) / 10,
        height20Db: Math.round((groundDb - decay * 1.7) * 10) / 10,
        height30Db: Math.round((groundDb - decay * 2.3) * 10) / 10,
        districtId
      });
    }
  }
  return data;
}

function generateViaductData(): NoiseDataPoint[] {
  const data: NoiseDataPoint[] = [];
  const districtId = 'viaduct';
  const length = 50;
  const width = 6;
  const spacing = 3;

  for (let x = -length / 2; x <= length / 2; x += spacing) {
    for (let z = -15; z <= 15; z += spacing) {
      const distFromViaduct = Math.abs(z);
      const viaductFactor = Math.max(0, 1 - distFromViaduct / 20);
      const trafficFactor = 0.8 + Math.random() * 0.4;

      const baseNoise = 65 + viaductFactor * 30 * trafficFactor;
      const randomFactor = (Math.random() - 0.5) * 8;
      const groundDb = baseNoise + randomFactor;
      const decay = 1.5 + viaductFactor * 1.5;

      data.push({
        x: Math.round(x * 10) / 10,
        z: Math.round(z * 10) / 10,
        groundDb: Math.round(groundDb * 10) / 10,
        height10Db: Math.round((groundDb - decay) * 10) / 10,
        height20Db: Math.round((groundDb - decay * 1.5) * 10) / 10,
        height30Db: Math.round((groundDb - decay * 2) * 10) / 10,
        districtId
      });
    }
  }
  return data;
}

export const districts: District[] = [
  {
    id: 'sunken-plaza',
    name: '下沉广场',
    description: '城市中心下沉式广场，噪音从中心向四周逐渐衰减',
    groundColor: 0x2a3a4a,
    data: generateSunkenPlazaData()
  },
  {
    id: 'commercial-street',
    name: '商业步行街',
    description: '繁华商业街道，沿街商铺人流密集，噪音较高',
    groundColor: 0x3d4f5f,
    data: generateCommercialStreetData()
  },
  {
    id: 'viaduct',
    name: '高架桥旁',
    description: '城市高架桥沿线，交通噪音显著，影响范围广',
    groundColor: 0x4a3a3a,
    data: generateViaductData()
  }
];

export const defaultDistrictId = 'sunken-plaza';
