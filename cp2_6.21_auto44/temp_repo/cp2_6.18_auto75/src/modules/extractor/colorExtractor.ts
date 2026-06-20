import {
  rgbToHex,
  rgbToHsl,
  type RGB,
  type HSL,
} from "../../utils/colorUtils";

export interface ExtractedColor {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  percentage: number;
}

interface Lab {
  L: number;
  a: number;
  b: number;
}

interface SampledPixel {
  rgb: RGB;
  lab: Lab;
}

function rgbToLab(r: number, g: number, b: number): Lab {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;
  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;
  let x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
  let y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.00000;
  let z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

function labDistance(a: Lab, b: Lab): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return dL * dL + da * da + db * db;
}

function samplePixels(imageData: ImageData): SampledPixel[] {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const targetSamples = 10000;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / targetSamples)));
  const samples: SampledPixel[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r === undefined || g === undefined || b === undefined) continue;
      const alpha = data[i + 3];
      if (alpha !== undefined && alpha < 125) continue;
      samples.push({
        rgb: { r, g, b },
        lab: rgbToLab(r, g, b),
      });
    }
  }
  return samples;
}

function kMeansPlusPlusInit(samples: SampledPixel[], k: number): Lab[] {
  const centroids: Lab[] = [];
  const firstIdx = Math.floor(Math.random() * samples.length);
  centroids.push({ ...samples[firstIdx].lab });
  for (let c = 1; c < k; c++) {
    const distances: number[] = new Array(samples.length);
    let totalDist = 0;
    for (let i = 0; i < samples.length; i++) {
      let minD = Infinity;
      for (const centroid of centroids) {
        const d = labDistance(samples[i].lab, centroid);
        if (d < minD) minD = d;
      }
      distances[i] = minD;
      totalDist += minD;
    }
    if (totalDist === 0) {
      const idx = Math.floor(Math.random() * samples.length);
      centroids.push({ ...samples[idx].lab });
      continue;
    }
    let threshold = Math.random() * totalDist;
    let selected = samples.length - 1;
    for (let i = 0; i < samples.length; i++) {
      threshold -= distances[i];
      if (threshold <= 0) {
        selected = i;
        break;
      }
    }
    centroids.push({ ...samples[selected].lab });
  }
  return centroids;
}

export function extractColors(
  imageData: ImageData,
  k: number = 5,
  iterations: number = 5
): ExtractedColor[] {
  const samples = samplePixels(imageData);
  if (samples.length === 0) {
    return [];
  }
  const effectiveK = Math.min(k, samples.length);
  let centroids = kMeansPlusPlusInit(samples, effectiveK);
  const assignments: number[] = new Array(samples.length);
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < samples.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dist = labDistance(samples[i].lab, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }
    const sums: Lab[] = centroids.map(() => ({ L: 0, a: 0, b: 0 }));
    const counts: number[] = new Array(centroids.length).fill(0);
    for (let i = 0; i < samples.length; i++) {
      const c = assignments[i];
      sums[c].L += samples[i].lab.L;
      sums[c].a += samples[i].lab.a;
      sums[c].b += samples[i].lab.b;
      counts[c]++;
    }
    for (let c = 0; c < centroids.length; c++) {
      if (counts[c] > 0) {
        centroids[c].L = sums[c].L / counts[c];
        centroids[c].a = sums[c].a / counts[c];
        centroids[c].b = sums[c].b / counts[c];
      }
    }
  }
  const finalAssignments: number[] = new Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let minDist = Infinity;
    let bestCluster = 0;
    for (let c = 0; c < centroids.length; c++) {
      const dist = labDistance(samples[i].lab, centroids[c]);
      if (dist < minDist) {
        minDist = dist;
        bestCluster = c;
      }
    }
    finalAssignments[i] = bestCluster;
  }
  const clusterSumsR: number[] = new Array(centroids.length).fill(0);
  const clusterSumsG: number[] = new Array(centroids.length).fill(0);
  const clusterSumsB: number[] = new Array(centroids.length).fill(0);
  const clusterCounts: number[] = new Array(centroids.length).fill(0);
  for (let i = 0; i < samples.length; i++) {
    const c = finalAssignments[i];
    clusterSumsR[c] += samples[i].rgb.r;
    clusterSumsG[c] += samples[i].rgb.g;
    clusterSumsB[c] += samples[i].rgb.b;
    clusterCounts[c]++;
  }
  const result: ExtractedColor[] = [];
  const totalCount = samples.length;
  for (let c = 0; c < centroids.length; c++) {
    if (clusterCounts[c] === 0) continue;
    const r = Math.round(clusterSumsR[c] / clusterCounts[c]);
    const g = Math.round(clusterSumsG[c] / clusterCounts[c]);
    const b = Math.round(clusterSumsB[c] / clusterCounts[c]);
    const rgb = { r, g, b };
    result.push({
      hex: rgbToHex(r, g, b),
      rgb,
      hsl: rgbToHsl(r, g, b),
      percentage: Math.round((clusterCounts[c] / totalCount) * 1000) / 10,
    });
  }
  result.sort((a, b) => b.hsl.s - a.hsl.s);
  return result;
}
