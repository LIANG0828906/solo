import type { Color, RGB } from '@/types';
import { createColor } from '@/utils/colorUtils';

interface PixelSample {
  r: number;
  g: number;
  b: number;
}

interface Cluster {
  center: RGB;
  pixels: PixelSample[];
}

function getDynamicStep(width: number, height: number, targetSamples: number = 10000): number {
  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / targetSamples)));
  return step;
}

function samplePixels(imageData: ImageData, step: number): PixelSample[] {
  const pixels: PixelSample[] = [];
  const { data, width, height } = imageData;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 128) continue;
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2]
      });
    }
  }

  return pixels;
}

function euclideanDistance(c1: PixelSample | RGB, c2: PixelSample | RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function initializeCentersKMeansPlusPlus(pixels: PixelSample[], k: number): RGB[] {
  const centers: RGB[] = [];
  const n = pixels.length;

  if (n === 0) {
    for (let i = 0; i < k; i++) {
      centers.push({ r: 128, g: 128, b: 128 });
    }
    return centers;
  }

  const firstIndex = Math.floor(Math.random() * n);
  centers.push({ ...pixels[firstIndex] });

  for (let i = 1; i < k; i++) {
    const distances: number[] = [];
    let totalDistance = 0;

    for (const pixel of pixels) {
      let minDist = Infinity;
      for (const center of centers) {
        const dist = euclideanDistance(pixel, center);
        if (dist < minDist) {
          minDist = dist;
        }
      }
      const distSq = minDist * minDist;
      distances.push(distSq);
      totalDistance += distSq;
    }

    let random = Math.random() * totalDistance;
    let selectedIndex = 0;
    for (let j = 0; j < distances.length; j++) {
      random -= distances[j];
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    centers.push({ ...pixels[selectedIndex] });
  }

  return centers;
}

function isConverged(oldCenters: RGB[], newCenters: RGB[], threshold: number = 1): boolean {
  for (let i = 0; i < oldCenters.length; i++) {
    const dist = euclideanDistance(oldCenters[i], newCenters[i]);
    if (dist > threshold) {
      return false;
    }
  }
  return true;
}

function kMeansClustering(pixels: PixelSample[], k: number, maxIterations: number = 20): Cluster[] {
  if (pixels.length === 0) {
    const clusters: Cluster[] = [];
    for (let i = 0; i < k; i++) {
      clusters.push({
        center: { r: Math.floor(255 * i / (k - 1 || 1)), g: Math.floor(255 * i / (k - 1 || 1)), b: Math.floor(255 * i / (k - 1 || 1)) },
        pixels: []
      });
    }
    return clusters;
  }

  let centers = initializeCentersKMeansPlusPlus(pixels, k);
  let clusters: Cluster[] = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    clusters = centers.map(center => ({ center: { ...center }, pixels: [] }));

    for (const pixel of pixels) {
      let minDist = Infinity;
      let nearestCluster = 0;
      for (let i = 0; i < centers.length; i++) {
        const dist = euclideanDistance(pixel, centers[i]);
        if (dist < minDist) {
          minDist = dist;
          nearestCluster = i;
        }
      }
      clusters[nearestCluster].pixels.push(pixel);
    }

    const newCenters: RGB[] = clusters.map(cluster => {
      if (cluster.pixels.length === 0) {
        return cluster.center;
      }
      let r = 0, g = 0, b = 0;
      for (const p of cluster.pixels) {
        r += p.r;
        g += p.g;
        b += p.b;
      }
      const count = cluster.pixels.length;
      return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
      };
    });

    if (isConverged(centers, newCenters)) {
      break;
    }

    centers = newCenters;
  }

  return clusters;
}

function handleEdgeCases(pixels: PixelSample[], k: number): Color[] | null {
  if (pixels.length === 0) {
    const colors: Color[] = [];
    for (let i = 0; i < k; i++) {
      const value = Math.floor(255 * i / (k - 1 || 1));
      colors.push(createColor({ r: value, g: value, b: value }, 1 / k));
    }
    return colors;
  }

  const isAllBlack = pixels.every(p => p.r < 30 && p.g < 30 && p.b < 30);
  if (isAllBlack) {
    const colors: Color[] = [];
    for (let i = 0; i < k; i++) {
      const value = Math.floor(30 * i / (k - 1 || 1));
      colors.push(createColor({ r: value, g: value, b: value }, 1 / k));
    }
    return colors;
  }

  const isAllWhite = pixels.every(p => p.r > 225 && p.g > 225 && p.b > 225);
  if (isAllWhite) {
    const colors: Color[] = [];
    for (let i = 0; i < k; i++) {
      const value = 255 - Math.floor(30 * i / (k - 1 || 1));
      colors.push(createColor({ r: value, g: value, b: value }, 1 / k));
    }
    return colors;
  }

  return null;
}

export function extractColors(imageData: ImageData, k: number = 5): Color[] {
  const { width, height } = imageData;
  const step = getDynamicStep(width, height);
  const pixels = samplePixels(imageData, step);

  const edgeCaseResult = handleEdgeCases(pixels, k);
  if (edgeCaseResult) {
    return edgeCaseResult;
  }

  const clusters = kMeansClustering(pixels, k);
  const totalPixels = pixels.length;

  const colors: Color[] = clusters
    .filter(cluster => cluster.pixels.length > 0)
    .map(cluster => ({
      ...createColor(cluster.center),
      frequency: cluster.pixels.length / totalPixels
    }))
    .sort((a, b) => b.frequency - a.frequency);

  while (colors.length < k) {
    const lastColor = colors[colors.length - 1] || createColor({ r: 128, g: 128, b: 128 }, 0);
    colors.push({ ...lastColor, frequency: 0 });
  }

  return colors.slice(0, k);
}
