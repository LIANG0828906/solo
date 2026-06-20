export interface EarthquakeData {
  id: number;
  longitude: number;
  latitude: number;
  depth: number;
  magnitude: number;
  timestamp: number;
}

const START_DATE = new Date('2020-01-01').getTime();
const END_DATE = new Date('2024-12-31').getTime();

export function generateEarthquakeData(count: number = 500): EarthquakeData[] {
  const data: EarthquakeData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i,
      longitude: Math.random() * 360 - 180,
      latitude: Math.random() * 180 - 90,
      depth: Math.random() * 700,
      magnitude: 2 + Math.random() * 7,
      timestamp: START_DATE + Math.random() * (END_DATE - START_DATE),
    });
  }
  return data;
}

export function magnitudeToSize(magnitude: number): number {
  const t = (magnitude - 2) / 7;
  return 0.1 + t * 0.4;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 0.84, b: 0 };
}

export function depthToColor(depth: number): [number, number, number] {
  const COLOR_0 = hexToRgb('#FFD700');
  const COLOR_350 = hexToRgb('#FF8C00');
  const COLOR_700 = hexToRgb('#DC143C');

  let t: number;
  let c1: { r: number; g: number; b: number };
  let c2: { r: number; g: number; b: number };

  if (depth <= 350) {
    t = depth / 350;
    c1 = COLOR_0;
    c2 = COLOR_350;
  } else {
    t = (depth - 350) / 350;
    c1 = COLOR_350;
    c2 = COLOR_700;
  }

  return [lerp(c1.r, c2.r, t), lerp(c1.g, c2.g, t), lerp(c1.b, c2.b, t)];
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function lonLatToVector3(
  longitude: number,
  latitude: number,
  depth: number,
  radius: number = 2
): [number, number, number] {
  const lonRad = (longitude * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  const r = radius + depth * 0.001;
  const x = r * Math.cos(latRad) * Math.cos(lonRad);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lonRad);
  return [x, y, z];
}

export const TIMELINE_START = START_DATE;
export const TIMELINE_END = END_DATE;
export const DAY_MS = 24 * 60 * 60 * 1000;
