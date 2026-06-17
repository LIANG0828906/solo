import { v4 as uuidv4 } from 'uuid';
import type { WindDataPoint, PressureLayer, DatasetMeta, DatasetResult } from '../shared/types';

interface RawWindEntry {
  x: number;
  y: number;
  z: number;
  speed: number;
  direction: number;
  altitude: number;
}

interface RawPressureEntry {
  altitude: number;
  pressure: number;
  points: { x: number; y: number; z: number }[];
}

interface RawDataset {
  meta: DatasetMeta;
  wind: RawWindEntry[];
  pressure: RawPressureEntry[];
}

function generateTyphoonData(): RawDataset {
  const wind: RawWindEntry[] = [];
  const pressure: RawPressureEntry[] = [];
  const numPoints = 4000;
  const center = { x: 0, y: 0, z: 0 };
  const maxRadius = 50;

  for (let i = 0; i < numPoints; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * maxRadius;
    const altitude = Math.random() * 15000;
    const speed = Math.max(0, 50 * (1 - radius / maxRadius) * (1 - Math.abs(altitude - 7500) / 7500) + Math.random() * 5);
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;
    const y = altitude / 15000 * 50 - 25;
    const direction = (angle + Math.PI / 2) * (180 / Math.PI);
    wind.push({ x, y, z, speed: Math.min(50, speed), direction, altitude });
  }

  for (let h = 0; h < 10; h++) {
    const altitude = h * 1500;
    const pressureVal = 1013 - altitude * 0.012 + (5 - h) * 3;
    const pts: { x: number; y: number; z: number }[] = [];
    for (let a = 0; a < 36; a++) {
      const angle = (a / 36) * Math.PI * 2;
      for (let r = 5; r <= 45; r += 10) {
        pts.push({
          x: Math.cos(angle) * r,
          y: altitude / 15000 * 50 - 25,
          z: Math.sin(angle) * r,
        });
      }
    }
    pressure.push({ altitude, pressure: pressureVal, points: pts });
  }

  return {
    meta: {
      key: 'typhoon',
      label: '台风',
      description: '涡旋风速0-50m/s，典型热带气旋结构',
      maxWindSpeed: 50,
      altitudeRange: [0, 15000],
      pressureRange: [950, 1013],
    },
    wind,
    pressure,
  };
}

function generateMonsoonData(): RawDataset {
  const wind: RawWindEntry[] = [];
  const pressure: RawPressureEntry[] = [];
  const numPoints = 4000;

  for (let i = 0; i < numPoints; i++) {
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    const altitude = Math.random() * 12000;
    const y = altitude / 12000 * 50 - 25;
    const baseSpeed = 15 + Math.sin(x * 0.05) * 8 + Math.cos(z * 0.03) * 5;
    const speed = Math.max(0, baseSpeed + Math.random() * 3);
    const direction = 210 + Math.sin(altitude / 3000) * 30;
    wind.push({ x, y, z, speed, direction, altitude });
  }

  for (let h = 0; h < 10; h++) {
    const altitude = h * 1200;
    const pressureVal = 1013 - altitude * 0.01 + Math.sin(h * 0.5) * 4;
    const pts: { x: number; y: number; z: number }[] = [];
    for (let xi = -45; xi <= 45; xi += 10) {
      for (let zi = -45; zi <= 45; zi += 10) {
        pts.push({
          x: xi,
          y: altitude / 12000 * 50 - 25,
          z: zi,
        });
      }
    }
    pressure.push({ altitude, pressure: pressureVal, points: pts });
  }

  return {
    meta: {
      key: 'monsoon',
      label: '季风',
      description: '定向风流，典型季风气压分布',
      maxWindSpeed: 28,
      altitudeRange: [0, 12000],
      pressureRange: [980, 1020],
    },
    wind,
    pressure,
  };
}

function generateMountainData(): RawDataset {
  const wind: RawWindEntry[] = [];
  const pressure: RawPressureEntry[] = [];
  const numPoints = 4000;

  for (let i = 0; i < numPoints; i++) {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    const altitude = Math.random() * 8000;
    const y = altitude / 8000 * 50 - 25;
    const canyonEffect = Math.exp(-((x * x) / 200 + (z * z) / 800));
    const turbulence = Math.sin(x * 0.3) * Math.cos(z * 0.2) * 15;
    const speed = Math.max(0, 20 * canyonEffect + turbulence + Math.random() * 8);
    const direction = 180 + Math.sin(x * 0.2 + z * 0.1) * 60;
    wind.push({ x, y, z, speed, direction, altitude });
  }

  for (let h = 0; h < 10; h++) {
    const altitude = h * 800;
    const pressureVal = 1013 - altitude * 0.015 + Math.sin(h) * 5;
    const pts: { x: number; y: number; z: number }[] = [];
    for (let a = 0; a < 24; a++) {
      const angle = (a / 24) * Math.PI * 2;
      for (let r = 5; r <= 35; r += 8) {
        pts.push({
          x: Math.cos(angle) * r,
          y: altitude / 8000 * 50 - 25,
          z: Math.sin(angle) * r * 1.5,
        });
      }
    }
    pressure.push({ altitude, pressure: pressureVal, points: pts });
  }

  return {
    meta: {
      key: 'mountain',
      label: '山地',
      description: '峡谷湍流，复杂山地风场结构',
      maxWindSpeed: 35,
      altitudeRange: [0, 8000],
      pressureRange: [890, 1013],
    },
    wind,
    pressure,
  };
}

export const datasets: Record<string, RawDataset> = {
  typhoon: generateTyphoonData(),
  monsoon: generateMonsoonData(),
  mountain: generateMountainData(),
};

export function getDatasetMeta(key: string): DatasetMeta | undefined {
  return datasets[key]?.meta;
}

export function getAllMetas(): DatasetMeta[] {
  return Object.values(datasets).map((d) => d.meta);
}
