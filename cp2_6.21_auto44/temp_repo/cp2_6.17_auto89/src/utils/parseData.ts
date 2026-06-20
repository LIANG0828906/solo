import Papa from 'papaparse';
import type { RawDataPoint, ProcessedDataPoint } from '../store';

const GLOBE_RADIUS = 200;
const MIN_HEIGHT = 20;
const MAX_HEIGHT = 100;

const COLOR_START = { r: 0x1e, g: 0x90, b: 0xff };
const COLOR_END = { r: 0xff, g: 0x45, b: 0x00 };

function interpolateColor(t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const r = Math.round(COLOR_START.r + (COLOR_END.r - COLOR_START.r) * clampedT);
  const g = Math.round(COLOR_START.g + (COLOR_END.g - COLOR_START.g) * clampedT);
  const b = Math.round(COLOR_START.b + (COLOR_END.b - COLOR_START.b) * clampedT);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function latLongToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

export async function parseCSV(file: File): Promise<RawDataPoint[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data: RawDataPoint[] = results.data
            .map((row) => {
              const keys = Object.keys(row);
              const lngKey = keys.find(k => k.toLowerCase().includes('lng') || k.toLowerCase().includes('lon') || k.toLowerCase().includes('经度')) || keys[0];
              const latKey = keys.find(k => k.toLowerCase().includes('lat') || k.toLowerCase().includes('纬度')) || keys[1];
              const intKey = keys.find(k => k.toLowerCase().includes('intensity') || k.toLowerCase().includes('strength') || k.toLowerCase().includes('value') || k.toLowerCase().includes('强度') || k.toLowerCase().includes('值')) || keys[2];

              const longitude = parseFloat(row[lngKey] || '0');
              const latitude = parseFloat(row[latKey] || '0');
              const intensity = parseFloat(row[intKey] || '0');

              if (isNaN(longitude) || isNaN(latitude) || isNaN(intensity)) {
                return null;
              }

              return { longitude, latitude, intensity };
            })
            .filter((item): item is RawDataPoint => item !== null);

          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

export function parseCSVString(csvString: string): RawDataPoint[] {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true
  });

  return result.data
    .map((row) => {
      const keys = Object.keys(row);
      const lngKey = keys.find(k => k.toLowerCase().includes('lng') || k.toLowerCase().includes('lon') || k.toLowerCase().includes('经度')) || keys[0];
      const latKey = keys.find(k => k.toLowerCase().includes('lat') || k.toLowerCase().includes('纬度')) || keys[1];
      const intKey = keys.find(k => k.toLowerCase().includes('intensity') || k.toLowerCase().includes('strength') || k.toLowerCase().includes('value') || k.toLowerCase().includes('强度') || k.toLowerCase().includes('值')) || keys[2];

      const longitude = parseFloat(row[lngKey] || '0');
      const latitude = parseFloat(row[latKey] || '0');
      const intensity = parseFloat(row[intKey] || '0');

      if (isNaN(longitude) || isNaN(latitude) || isNaN(intensity)) {
        return null;
      }

      return { longitude, latitude, intensity };
    })
    .filter((item): item is RawDataPoint => item !== null);
}

export function processDataPoints(rawData: RawDataPoint[]): ProcessedDataPoint[] {
  if (rawData.length === 0) return [];

  const intensities = rawData.map(d => d.intensity);
  const minIntensity = Math.min(...intensities);
  const maxIntensity = Math.max(...intensities);
  const intensityRange = maxIntensity - minIntensity || 1;

  return rawData.map((point, index) => {
    const normalizedIntensity = (point.intensity - minIntensity) / intensityRange;
    const height = MIN_HEIGHT + normalizedIntensity * (MAX_HEIGHT - MIN_HEIGHT);
    const surfacePosition = latLongToVector3(point.latitude, point.longitude, GLOBE_RADIUS);

    return {
      ...point,
      id: `point-${index}-${Date.now()}`,
      position: surfacePosition,
      height,
      color: interpolateColor(normalizedIntensity)
    };
  }).slice(0, 1000);
}

export function getDataStatistics(data: RawDataPoint[]) {
  if (data.length === 0) {
    return {
      count: 0,
      maxIntensity: 0,
      minIntensity: 0,
      avgIntensity: 0
    };
  }

  const intensities = data.map(d => d.intensity);
  const sum = intensities.reduce((a, b) => a + b, 0);

  return {
    count: data.length,
    maxIntensity: Math.max(...intensities),
    minIntensity: Math.min(...intensities),
    avgIntensity: sum / intensities.length
  };
}

export const presetsData = {
  earthquake: `longitude,latitude,intensity
-122.4194,37.7749,8.5
-118.2437,34.0522,7.2
-74.0060,40.7128,5.1
139.6917,35.6895,9.1
103.851957,1.352083,6.3
77.2090,28.6139,7.8
-46.6333,-23.5505,6.5
-77.0369,-12.0464,8.0
37.6173,55.7558,5.8
116.4074,39.9042,7.5
-99.1332,19.4326,6.9
28.9784,41.0082,7.1
-0.1276,51.5074,4.5
2.3522,48.8566,4.8
12.4964,41.9028,5.2
151.2093,-33.8688,5.9
55.2708,25.2048,5.4
106.8456,-6.2088,7.6
72.8777,19.0760,6.7
35.2332,31.7683,6.1
-87.6298,41.8781,5.0
-95.3698,29.7604,4.9
-111.8910,40.7608,7.3
-66.9036,10.4806,6.8
-149.9003,61.2181,8.8`,

  population: `longitude,latitude,intensity
116.4074,39.9042,95
121.4737,31.2304,92
139.6917,35.6895,90
-74.0060,40.7128,88
-118.2437,34.0522,85
77.2090,28.6139,86
72.8777,19.0760,89
-46.6333,-23.5505,82
-99.1332,19.4326,80
106.8456,-6.2088,78
28.9784,41.0082,76
55.2708,25.2048,74
103.851957,1.352083,77
37.6173,55.7558,72
-0.1276,51.5074,70
2.3522,48.8566,68
12.4964,41.9028,66
151.2093,-33.8688,64
13.4050,52.5200,65
135.5022,34.6937,73
-77.0369,-12.0464,71
114.1694,22.3193,83
-79.3832,43.6532,62
35.2332,31.7683,58
126.9780,37.5665,81`,

  temperature: `longitude,latitude,intensity
-122.4194,37.7749,18
-118.2437,34.0522,24
-74.0060,40.7128,12
139.6917,35.6895,15
103.851957,1.352083,27
77.2090,28.6139,25
-46.6333,-23.5505,20
-77.0369,-12.0464,19
37.6173,55.7558,5
116.4074,39.9042,13
-99.1332,19.4326,16
28.9784,41.0082,14
-0.1276,51.5074,9
2.3522,48.8566,10
12.4964,41.9028,17
151.2093,-33.8688,21
55.2708,25.2048,29
106.8456,-6.2088,26
72.8777,19.0760,28
35.2332,31.7683,22
-87.6298,41.8781,8
-95.3698,29.7604,23
-149.9003,61.2181,-5
-66.9036,10.4806,24
135.5022,34.6937,16`
};
