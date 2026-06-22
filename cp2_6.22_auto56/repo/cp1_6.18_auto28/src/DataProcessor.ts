import { parse } from 'csv-parse/browser/esm/sync';
import type { DataPoint, TerrainData, TerrainVertex, MarkerData, ColorTheme, PresetType } from './types';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const GRID_SEGMENTS_X = 100;
const GRID_SEGMENTS_Y = 100;
const MAX_HEIGHT = 5;

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

function lerpColor(
  color1: [number, number, number],
  color2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    color1[0] + (color2[0] - color1[0]) * t,
    color1[1] + (color2[1] - color1[1]) * t,
    color1[2] + (color2[2] - color1[2]) * t,
  ];
}

function perlinNoise2D(x: number, y: number, seed: number = 0): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  function fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  const p = new Array(512);
  const permutation = new Array(256);
  for (let i = 0; i < 256; i++) {
    permutation[i] = Math.floor(Math.abs(Math.sin(i + seed) * 10000)) % 256;
  }
  for (let i = 0; i < 512; i++) {
    p[i] = permutation[i & 255];
  }

  const u = fade(xf);
  const v = fade(yf);

  const aa = p[p[X] + Y];
  const ab = p[p[X] + Y + 1];
  const ba = p[p[X + 1] + Y];
  const bb = p[p[X + 1] + Y + 1];

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);

  return (lerp(x1, x2, v) + 1) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export class DataProcessor {
  static async parseCSV(file: File): Promise<DataPoint[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });

          const points: DataPoint[] = records.map((record: Record<string, string>) => {
            const x = parseFloat(record.x || record.X);
            const y = parseFloat(record.y || record.Y);
            const value = parseFloat(record.value || record.Value || record.VALUE);

            if (isNaN(x) || isNaN(y) || isNaN(value)) {
              throw new Error('CSV格式错误，必须包含x,y,value三列数值数据');
            }

            return { x, y, value };
          });

          resolve(points);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('CSV解析失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  static generatePresetData(type: PresetType): DataPoint[] {
    const points: DataPoint[] = [];
    const step = 1;

    for (let x = -10; x <= 10; x += step) {
      for (let y = -10; y <= 10; y += step) {
        let value: number;

        switch (type) {
          case 'hills':
            value = Math.sin(x * 0.5) * Math.cos(y * 0.5) + 0.5 * Math.sin(x * 0.3 + y * 0.3);
            value = (value + 1.5) * 0.5;
            break;

          case 'mountains':
            value = 0;
            for (let octave = 0; octave < 4; octave++) {
              const frequency = Math.pow(2, octave) * 0.1;
              const amplitude = Math.pow(0.5, octave);
              value += perlinNoise2D(x * frequency + 100, y * frequency + 100, octave) * amplitude;
            }
            value = Math.pow(value, 1.5);
            break;

          case 'craters':
            value = 0;
            const numCraters = 8;
            for (let i = 0; i < numCraters; i++) {
              const cx = gaussianRandom(0, 5);
              const cy = gaussianRandom(0, 5);
              const radius = 2 + Math.random() * 3;
              const depth = 0.5 + Math.random() * 0.5;
              const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
              if (dist < radius) {
                value -= depth * Math.exp(-(dist * dist) / (radius * radius * 0.5));
              }
            }
            value = (value + 1) / 2;
            break;

          default:
            value = 0;
        }

        points.push({ x, y, value: Math.max(0, Math.min(1, value)) });
      }
    }

    return points;
  }

  static interpolateValue(points: DataPoint[], x: number, y: number): number {
    let closest = points[0];
    let minDist = Infinity;

    for (const point of points) {
      const dist = (point.x - x) ** 2 + (point.y - y) ** 2;
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }

    if (minDist < 0.01) {
      return closest.value;
    }

    let totalWeight = 0;
    let weightedValue = 0;
    const radius = 3;

    for (const point of points) {
      const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (dist < radius) {
        const weight = 1 / (1 + dist * 2);
        totalWeight += weight;
        weightedValue += point.value * weight;
      }
    }

    if (totalWeight > 0) {
      return weightedValue / totalWeight;
    }

    return closest.value;
  }

  static generateTerrainData(
    points: DataPoint[],
    colorTheme: ColorTheme
  ): TerrainData {
    const vertices: TerrainVertex[] = [];
    const indices: number[] = [];
    const markers: MarkerData[] = [];

    const values = points.map((p) => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const lowColor = hexToRgb(colorTheme.lowColor);
    const highColor = hexToRgb(colorTheme.highColor);

    const stepX = GRID_WIDTH / GRID_SEGMENTS_X;
    const stepY = GRID_HEIGHT / GRID_SEGMENTS_Y;

    for (let j = 0; j <= GRID_SEGMENTS_Y; j++) {
      for (let i = 0; i <= GRID_SEGMENTS_X; i++) {
        const x = (i * stepX) - GRID_WIDTH / 2;
        const y = (j * stepY) - GRID_HEIGHT / 2;

        const rawValue = this.interpolateValue(points, x, y);
        const normalizedValue = (rawValue - minValue) / valueRange;
        const height = normalizedValue * MAX_HEIGHT;

        const t = Math.max(0, Math.min(1, normalizedValue));
        const color = lerpColor(lowColor, highColor, t);

        vertices.push({
          position: [x, y, height],
          color,
          height,
        });
      }
    }

    for (let j = 0; j < GRID_SEGMENTS_Y; j++) {
      for (let i = 0; i < GRID_SEGMENTS_X; i++) {
        const a = j * (GRID_SEGMENTS_X + 1) + i;
        const b = a + 1;
        const c = a + (GRID_SEGMENTS_X + 1);
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    for (let x = -10; x <= 10; x++) {
      for (let y = -10; y <= 10; y++) {
        const rawValue = this.interpolateValue(points, x, y);
        const normalizedValue = (rawValue - minValue) / valueRange;
        const height = normalizedValue * MAX_HEIGHT;
        const t = Math.max(0, Math.min(1, normalizedValue));
        const color = lerpColor(lowColor, highColor, t);

        markers.push({
          x,
          y,
          height,
          color,
          value: rawValue,
        });
      }
    }

    return {
      vertices,
      indices,
      markers,
      gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
      bounds: { minValue, maxValue },
    };
  }
}
