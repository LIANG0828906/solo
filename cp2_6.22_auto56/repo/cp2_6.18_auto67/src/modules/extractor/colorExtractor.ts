import { rgbToHex, rgbToHsl, hexToRgb } from '../../utils/colorUtils';
import type { RGB, HSL } from '../../utils/colorUtils';

export interface ExtractedColor {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  percentage: number;
}

const CLUSTER_COUNT = 5;
const MAX_ITERATIONS = 5;
const MAX_PIXELS = 10000;

function samplePixels(imageData: ImageData): RGB[] {
  const { width, height, data } = imageData;
  const total = width * height;
  const pixels: RGB[] = [];

  if (total <= MAX_PIXELS) {
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      const a = data[idx + 3];
      if (a < 125) continue;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      });
    }
  } else {
    const step = Math.ceil(Math.sqrt(total / MAX_PIXELS));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a < 125) continue;
        pixels.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
        });
      }
    }
  }

  return pixels;
}

function distance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function findNearest(pixel: RGB, centroids: RGB[]): number {
  let minIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const d = distance(pixel, centroids[i]);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

function initializeCentroids(pixels: RGB[], k: number): RGB[] {
  const centroids: RGB[] = [];
  const used = new Set<number>();
  while (centroids.length < k && used.size < pixels.length) {
    const idx = Math.floor(Math.random() * pixels.length);
    if (used.has(idx)) continue;
    used.add(idx);
    centroids.push({ ...pixels[idx] });
  }
  return centroids;
}

export function extractColors(imageData: ImageData): ExtractedColor[] {
  const pixels = samplePixels(imageData);
  if (pixels.length === 0) return [];

  const k = Math.min(CLUSTER_COUNT, pixels.length);
  let centroids = initializeCentroids(pixels, k);
  const assignments = new Int32Array(pixels.length);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      assignments[i] = findNearest(pixels[i], centroids);
    }

    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c].r += pixels[i].r;
      sums[c].g += pixels[i].g;
      sums[c].b += pixels[i].b;
      sums[c].count++;
    }

    for (let i = 0; i < k; i++) {
      if (sums[i].count > 0) {
        centroids[i] = {
          r: Math.round(sums[i].r / sums[i].count),
          g: Math.round(sums[i].g / sums[i].count),
          b: Math.round(sums[i].b / sums[i].count),
        };
      }
    }
  }

  const finalSums = Array.from({ length: k }, () => 0);
  for (let i = 0; i < pixels.length; i++) {
    finalSums[assignments[i]]++;
  }

  const results: Array<{
    centroid: RGB;
    count: number;
    hex: string;
    rgb: RGB;
    hsl: HSL;
    percentage: number;
  }> = [];

  for (let i = 0; i < k; i++) {
    if (finalSums[i] === 0) continue;
    const hex = rgbToHex(centroids[i].r, centroids[i].g, centroids[i].b);
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    results.push({
      centroid: centroids[i],
      count: finalSums[i],
      hex,
      rgb,
      hsl,
      percentage: (finalSums[i] / pixels.length) * 100,
    });
  }

  results.sort((a, b) => b.hsl.s - a.hsl.s);

  const totalCount = results.reduce((s, r) => s + r.count, 0);
  return results.map(r => ({
    hex: r.hex,
    rgb: r.rgb,
    hsl: r.hsl,
    percentage: totalCount > 0 ? Math.round((r.count / totalCount) * 1000) / 10 : 0,
  }));
}
