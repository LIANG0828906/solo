interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ClusterResult {
  centers: RGB[];
  counts: number[];
}

interface AnalyzeWorkerRequest {
  type: 'analyze';
  pixelData: Uint8ClampedArray;
  width: number;
  height: number;
  samplePoints: number;
  kClusters: number;
  topColors: number;
}

interface AnalyzeWorkerResponse {
  type: 'result' | 'error';
  payload: any;
}

const SAMPLE_POINTS = 2000;
const K_CLUSTERS = 12;
const TOP_COLORS = 5;
const MAX_KMEANS_ITERATIONS = 20;
const MIN_CLUSTER_RATIO = 0.01;

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => {
    const hex = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

function euclideanDistanceLab(a: number[], b: number[]): number {
  const d0 = a[0] - b[0];
  const d1 = a[1] - b[1];
  const d2 = a[2] - b[2];
  return Math.sqrt(d0 * d0 + d1 * d1 + d2 * d2);
}

function rgbToLab(rgb: RGB): number[] {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100; g *= 100; b *= 100;

  const X = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  const refX = 95.047, refY = 100.0, refZ = 108.883;
  let x = X / refX, y = Y / refY, z = Z / refZ;

  const eps = 0.008856, kappa = 903.3;
  x = x > eps ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
  y = y > eps ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
  z = z > eps ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function samplePixels(data: Uint8ClampedArray, width: number, height: number, samplePoints: number): RGB[] {
  const totalPixels = width * height;
  const pixels: RGB[] = [];
  const step = Math.max(1, Math.floor(totalPixels / samplePoints));

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += step) {
    const byteIndex = pixelIndex * 4;
    const r = data[byteIndex];
    const g = data[byteIndex + 1];
    const b = data[byteIndex + 2];
    const a = data[byteIndex + 3];
    if (a > 128) {
      pixels.push({ r, g, b });
    }
  }
  return pixels;
}

function kMeansPlusPlusInit(pixels: RGB[], labs: number[][], k: number): RGB[] {
  const n = pixels.length;
  const centers: RGB[] = [];
  const centerLabs: number[][] = [];

  const firstIdx = Math.floor(Math.random() * n);
  centers.push({ ...pixels[firstIdx] });
  centerLabs.push(labs[firstIdx]);

  for (let i = 1; i < k; i++) {
    const distances = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      let minDist = Infinity;
      for (let c = 0; c < centerLabs.length; c++) {
        const dist = euclideanDistanceLab(labs[j], centerLabs[c]);
        if (dist < minDist) minDist = dist;
      }
      distances[j] = minDist * minDist;
    }

    let sum = 0;
    for (let j = 0; j < n; j++) sum += distances[j];
    if (sum === 0) {
      centers.push({ ...pixels[Math.floor(Math.random() * n)] });
      centerLabs.push(labs[Math.floor(Math.random() * n)]);
      continue;
    }

    let r = Math.random() * sum;
    let selectedIdx = 0;
    for (let j = 0; j < n; j++) {
      r -= distances[j];
      if (r <= 0) {
        selectedIdx = j;
        break;
      }
    }
    centers.push({ ...pixels[selectedIdx] });
    centerLabs.push(labs[selectedIdx]);
  }

  return centers;
}

function kMeansClustering(pixels: RGB[], k: number): ClusterResult {
  if (pixels.length === 0) return { centers: [], counts: [] };

  const n = pixels.length;
  const actualK = Math.min(k, n);

  const labs: number[][] = new Array(n);
  for (let i = 0; i < n; i++) {
    labs[i] = rgbToLab(pixels[i]);
  }

  const centersRgb = kMeansPlusPlusInit(pixels, labs, actualK);
  const centersLab: number[][] = centersRgb.map(c => rgbToLab(c));

  const assignments = new Int32Array(n);

  for (let iter = 0; iter < MAX_KMEANS_ITERATIONS; iter++) {
    let changed = false;

    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let j = 0; j < centersLab.length; j++) {
        const dist = euclideanDistanceLab(labs[i], centersLab[j]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = j;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    const sums = new Array(centersRgb.length);
    for (let j = 0; j < centersRgb.length; j++) {
      sums[j] = { r: 0, g: 0, b: 0, count: 0 };
    }

    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      sums[c].r += pixels[i].r;
      sums[c].g += pixels[i].g;
      sums[c].b += pixels[i].b;
      sums[c].count++;
    }

    for (let j = 0; j < centersRgb.length; j++) {
      if (sums[j].count > 0) {
        centersRgb[j].r = Math.round(sums[j].r / sums[j].count);
        centersRgb[j].g = Math.round(sums[j].g / sums[j].count);
        centersRgb[j].b = Math.round(sums[j].b / sums[j].count);
        centersLab[j] = rgbToLab(centersRgb[j]);
      }
    }
  }

  const counts = new Array(centersRgb.length).fill(0);
  for (let i = 0; i < n; i++) {
    counts[assignments[i]]++;
  }

  return { centers: centersRgb, counts };
}

function cie76DeltaE(hex1: string, hex2: string): number {
  const parseHex = (hex: string): RGB | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  };

  const rgb1 = parseHex(hex1);
  const rgb2 = parseHex(hex2);
  if (!rgb1 || !rgb2) return Infinity;

  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);
  const dL = lab1[0] - lab2[0];
  const dA = lab1[1] - lab2[1];
  const dB = lab1[2] - lab2[2];

  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

function areColorsSimilarLab(c1: RGB, c2: RGB, thresholdDeltaE: number): boolean {
  return cie76DeltaE(
    rgbToHex(c1.r, c1.g, c1.b),
    rgbToHex(c2.r, c2.g, c2.b)
  ) < thresholdDeltaE;
}

function extractTopColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  samplePoints: number = SAMPLE_POINTS,
  kClusters: number = K_CLUSTERS,
  topColors: number = TOP_COLORS
) {
  const pixels = samplePixels(data, width, height, samplePoints);

  if (pixels.length === 0) return [];

  const { centers, counts } = kMeansClustering(pixels, kClusters);
  const totalSampled = pixels.length;

  const validClusters: { center: RGB; count: number; ratio: number }[] = [];
  for (let i = 0; i < centers.length; i++) {
    if (counts[i] > 0) {
      const ratio = counts[i] / totalSampled;
      if (ratio >= MIN_CLUSTER_RATIO) {
        validClusters.push({
          center: centers[i],
          count: counts[i],
          ratio,
        });
      }
    }
  }

  const merged: { center: RGB; count: number; ratio: number }[] = [];
  const MERGE_THRESHOLD = 18;

  for (const cluster of validClusters) {
    let mergedInto = false;
    for (const existing of merged) {
      if (areColorsSimilarLab(cluster.center, existing.center, MERGE_THRESHOLD)) {
        const totalCount = existing.count + cluster.count;
        existing.center.r = Math.round(
          (existing.center.r * existing.count + cluster.center.r * cluster.count) / totalCount
        );
        existing.center.g = Math.round(
          (existing.center.g * existing.count + cluster.center.g * cluster.count) / totalCount
        );
        existing.center.b = Math.round(
          (existing.center.b * existing.count + cluster.center.b * cluster.count) / totalCount
        );
        existing.count = totalCount;
        existing.ratio = existing.count / totalSampled;
        mergedInto = true;
        break;
      }
    }
    if (!mergedInto) {
      merged.push({
        center: { ...cluster.center },
        count: cluster.count,
        ratio: cluster.ratio,
      });
    }
  }

  merged.sort((a, b) => b.ratio - a.ratio);

  const topPercentThreshold = 0.05;
  let cumulativeRatio = 0;
  const topByArea: typeof merged = [];

  for (const c of merged) {
    if (cumulativeRatio < topPercentThreshold || topByArea.length < topColors) {
      topByArea.push(c);
      cumulativeRatio += c.ratio;
    }
    if (topByArea.length >= topColors) break;
  }

  const topList = topByArea.length >= 2 ? topByArea : merged.slice(0, topColors);
  const finalList = topList.slice(0, topColors);
  const finalTotal = finalList.reduce((sum, c) => sum + c.count, 0);

  return finalList.map(c => ({
    hex: rgbToHex(c.center.r, c.center.g, c.center.b),
    rgb: { r: c.center.r, g: c.center.g, b: c.center.b },
    ratio: finalTotal > 0 ? Math.round((c.count / finalTotal) * 1000) / 10 : 0,
  }));
}

self.onmessage = function (e: MessageEvent<AnalyzeWorkerRequest>) {
  try {
    const { pixelData, width, height, samplePoints, kClusters, topColors } = e.data;
    const result = extractTopColors(pixelData, width, height, samplePoints, kClusters, topColors);

    const response: AnalyzeWorkerResponse = {
      type: 'result',
      payload: result,
    };
    self.postMessage(response, []);
  } catch (error) {
    const response: AnalyzeWorkerResponse = {
      type: 'error',
      payload: (error as Error).message,
    };
    self.postMessage(response);
  }
};
