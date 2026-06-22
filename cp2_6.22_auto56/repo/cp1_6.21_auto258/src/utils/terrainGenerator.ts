import { createNoise2D } from 'simplex-noise';
import { TerrainParams, TerrainStats, GRID_RESOLUTION } from '../types';

export function generateHeightMap(params: TerrainParams): Float32Array {
  const { heightAmplitude, smoothness, seed } = params;
  const resolution = GRID_RESOLUTION + 1;
  const size = resolution * resolution;
  const heightMap = new Float32Array(size);
  
  const noise2D = createNoise2D(() => seed);
  const frequency = (1.1 - smoothness) * 0.08;
  const baseHeight = 0.3;
  
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const idx = z * resolution + x;
      const nx = x * frequency;
      const nz = z * frequency;
      
      let height = 0;
      let amplitude = 1;
      let freq = 1;
      let maxValue = 0;
      
      for (let octave = 0; octave < 4; octave++) {
        height += noise2D(nx * freq, nz * freq) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        freq *= 2;
      }
      
      height = height / maxValue;
      height = (height + 1) / 2;
      height = height * heightAmplitude + baseHeight;
      
      heightMap[idx] = height;
    }
  }
  
  return heightMap;
}

export function generateTerrainStats(heightMap: Float32Array): TerrainStats {
  let max = -Infinity;
  let min = Infinity;
  let sum = 0;
  
  for (let i = 0; i < heightMap.length; i++) {
    const h = heightMap[i];
    if (h > max) max = h;
    if (h < min) min = h;
    sum += h;
  }
  
  return {
    maxHeight: parseFloat(max.toFixed(3)),
    minHeight: parseFloat(min.toFixed(3)),
    avgHeight: parseFloat((sum / heightMap.length).toFixed(3)),
    vertexCount: heightMap.length
  };
}

export function getColorGradient(tone: number): { low: [number, number, number]; high: [number, number, number] } {
  const greenBrown: [number, number, number] = [0.2, 0.5, 0.2];
  const brown: [number, number, number] = [0.5, 0.35, 0.2];
  const redYellow: [number, number, number] = [0.9, 0.7, 0.2];
  const red: [number, number, number] = [0.8, 0.2, 0.1];
  
  const t = Math.max(0, Math.min(1, tone));
  
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const lerpColor = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t)
  ];
  
  return {
    low: lerpColor(greenBrown, redYellow, t),
    high: lerpColor(brown, red, t)
  };
}
