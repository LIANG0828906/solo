import * as THREE from 'three';
import { DataSourceType } from '../store/useTerrainStore';

export const GRID_SIZE = 64;
export const TERRAIN_SIZE = 20;

export function perlin2(x: number, y: number): number {
  const permutation = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
    8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
    35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
    134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
    55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
    18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
    250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
    189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
    172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
    228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
    107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
  ];
  const p = new Array(512);
  for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i] = permutation[i];
  }

  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const A = p[X] + Y;
  const B = p[X + 1] + Y;

  return lerp(
    v,
    lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
    lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1)),
  );
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number) {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function fbm(x: number, y: number, octaves = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * perlin2(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / maxValue;
}

export function generateHeightData(size: number, elevation: number): Float32Array {
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 3;
      const ny = y / size * 3;
      heights[y * size + x] = (fbm(nx, ny, 4) * 0.5 + 0.5) * elevation;
    }
  }
  return heights;
}

export function generateHeatmapData(
  size: number,
  source: DataSourceType,
  heights: Float32Array,
): Float32Array {
  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const h = heights[idx];
      const nx = x / size;
      const ny = y / size;
      const noise = fbm(nx * 4 + 10, ny * 4 + 20, 3) * 0.5 + 0.5;

      let value = 0;
      switch (source) {
        case 'temperature':
          value = 0.3 + noise * 0.5 - h * 0.12;
          break;
        case 'humidity':
          value = 0.2 + noise * 0.4 + h * 0.15;
          break;
        case 'population':
          value = noise * 0.6 + (1 - Math.abs(h - 0.5) * 1.5) * 0.3;
          break;
      }
      data[idx] = Math.max(0, Math.min(1, value));
    }
  }
  return data;
}

export function valueToColor(t: number): THREE.Color {
  const color = new THREE.Color();
  t = Math.max(0, Math.min(1, t));
  if (t < 0.33) {
    const k = t / 0.33;
    color.setRGB(0, k, 1 - k);
  } else if (t < 0.66) {
    const k = (t - 0.33) / 0.33;
    color.setRGB(k, 1, 0);
  } else {
    const k = (t - 0.66) / 0.34;
    color.setRGB(1, 1 - k, 0);
  }
  return color;
}

export function elevationToColor(t: number): THREE.Color {
  t = Math.max(0, Math.min(1, t));
  const low = new THREE.Color('#8B5A2B');
  const high = new THREE.Color('#D2B48C');
  return low.clone().lerp(high, t);
}
