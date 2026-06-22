export type FilterType =
  | 'none'
  | 'oil'
  | 'watercolor'
  | 'sketch'
  | 'pixelate'
  | 'neon'
  | 'mosaic';

export interface FilterOptions {
  intensity?: number;
  kernelSize?: number;
  pixelSize?: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number, w: number, h: number): [number, number, number, number] {
  x = clamp(x, 0, w - 1);
  y = clamp(y, 0, h - 1);
  const idx = (y * width + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}

function applyOil(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
  const radius = Math.max(1, Math.floor(intensity * 2));
  const levels = 20;
  const src = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rHist = new Array(levels + 1).fill(0);
      const gHist = new Array(levels + 1).fill(0);
      const bHist = new Array(levels + 1).fill(0);
      const rCount = new Array(levels + 1).fill(0);
      const gCount = new Array(levels + 1).fill(0);
      const bCount = new Array(levels + 1).fill(0);

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const [r, g, b] = getPixel(src, width, x + dx, y + dy, width, height);
          const rIdx = Math.floor((r / 255) * levels);
          const gIdx = Math.floor((g / 255) * levels);
          const bIdx = Math.floor((b / 255) * levels);
          rHist[rIdx] += r;
          gHist[gIdx] += g;
          bHist[bIdx] += b;
          rCount[rIdx]++;
          gCount[gIdx]++;
          bCount[bIdx]++;
        }
      }

      let maxR = 0, maxG = 0, maxB = 0;
      for (let i = 1; i <= levels; i++) {
        if (rCount[i] > rCount[maxR]) maxR = i;
        if (gCount[i] > gCount[maxG]) maxG = i;
        if (bCount[i] > bCount[maxB]) maxB = i;
      }

      const idx = (y * width + x) * 4;
      data[idx] = rCount[maxR] > 0 ? rHist[maxR] / rCount[maxR] : 0;
      data[idx + 1] = gCount[maxG] > 0 ? gHist[maxG] / gCount[maxG] : 0;
      data[idx + 2] = bCount[maxB] > 0 ? bHist[maxB] / bCount[maxB] : 0;
    }
  }
}

function gaussianBlur(src: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(src);
  const temp = new Uint8ClampedArray(src.length);
  const w = Math.floor(radius * 3);
  const weights: number[] = [];
  let sum = 0;
  for (let i = -w; i <= w; i++) {
    const v = Math.exp(-(i * i) / (2 * radius * radius));
    weights.push(v);
    sum += v;
  }
  for (let i = 0; i < weights.length; i++) weights[i] /= sum;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let i = -w; i <= w; i++) {
        const [pr, pg, pb, pa] = getPixel(src, width, x + i, y, width, height);
        const wt = weights[i + w];
        r += pr * wt;
        g += pg * wt;
        b += pb * wt;
        a += pa * wt;
      }
      const idx = (y * width + x) * 4;
      temp[idx] = r;
      temp[idx + 1] = g;
      temp[idx + 2] = b;
      temp[idx + 3] = a;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let i = -w; i <= w; i++) {
        const [pr, pg, pb, pa] = getPixel(temp, width, x, y + i, width, height);
        const wt = weights[i + w];
        r += pr * wt;
        g += pg * wt;
        b += pb * wt;
        a += pa * wt;
      }
      const idx = (y * width + x) * 4;
      result[idx] = r;
      result[idx + 1] = g;
      result[idx + 2] = b;
      result[idx + 3] = a;
    }
  }

  return result;
}

function applyWatercolor(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
  const blurred = gaussianBlur(data, width, height, 1.2 * intensity);
  for (let i = 0; i < data.length; i += 4) {
    let r = blurred[i];
    let g = blurred[i + 1];
    let b = blurred[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    r = clamp(r + (r - luminance) * 0.3 * intensity, 0, 255);
    g = clamp(g + (g - luminance) * 0.3 * intensity, 0, 255);
    b = clamp(b + (b - luminance) * 0.3 * intensity, 0, 255);
    const levels = 32;
    r = Math.round(r / levels) * levels;
    g = Math.round(g / levels) * levels;
    b = Math.round(b / levels) * levels;
    data[i] = clamp(r + 0, 0, 255);
    data[i + 1] = clamp(g + 5, 0, 255);
    data[i + 2] = clamp(b + 10, 0, 255);
  }
}

function applySketch(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
  const gray = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i] = v;
    gray[i + 1] = v;
    gray[i + 2] = v;
    gray[i + 3] = data[i + 3];
  }
  const inverted = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i += 4) {
    inverted[i] = 255 - gray[i];
    inverted[i + 1] = 255 - gray[i + 1];
    inverted[i + 2] = 255 - gray[i + 2];
    inverted[i + 3] = gray[i + 3];
  }
  const blurredInv = gaussianBlur(inverted, width, height, 10 * intensity);
  for (let i = 0; i < data.length; i += 4) {
    const base = gray[i];
    const blend = blurredInv[i];
    const result = base + (base * blend) / (256 - blend);
    const v = clamp(result, 0, 255);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

function applyPixelate(data: Uint8ClampedArray, width: number, height: number, pixelSize: number): void {
  const src = new Uint8ClampedArray(data);
  const size = Math.max(2, pixelSize);
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let dy = 0; dy < size && y + dy < height; dy++) {
        for (let dx = 0; dx < size && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += src[idx];
          g += src[idx + 1];
          b += src[idx + 2];
          a += src[idx + 3];
          count++;
        }
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);
      for (let dy = 0; dy < size && y + dy < height; dy++) {
        for (let dx = 0; dx < size && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }
}

function applyNeon(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
  const src = new Uint8ClampedArray(data);
  const gray = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      gray[y * width + x] = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const tl = gray[(y - 1) * width + (x - 1)];
      const t = gray[(y - 1) * width + x];
      const tr = gray[(y - 1) * width + (x + 1)];
      const l = gray[y * width + (x - 1)];
      const r = gray[y * width + (x + 1)];
      const bl = gray[(y + 1) * width + (x - 1)];
      const b = gray[(y + 1) * width + x];
      const br = gray[(y + 1) * width + (x + 1)];

      const gx = tl * 1 + t * 0 + tr * -1 + l * 2 + r * -2 + bl * 1 + b * 0 + br * -1;
      const gy = tl * 1 + t * 2 + tr * 1 + l * 0 + r * 0 + bl * -1 + b * -2 + br * -1;
      let edge = Math.sqrt(gx * gx + gy * gy);
      edge = clamp(edge * intensity * 0.8, 0, 255);
      const origR = src[idx];
      const origG = src[idx + 1];
      const origB = src[idx + 2];
      data[idx] = clamp(origR * 0.25 + edge * 1.1, 0, 255);
      data[idx + 1] = clamp(origG * 0.15 + edge * 0.4, 0, 255);
      data[idx + 2] = clamp(origB * 0.35 + edge * 1.4, 0, 255);
    }
  }
}

function applyMosaic(data: Uint8ClampedArray, width: number, height: number, blockSize: number): void {
  const src = new Uint8ClampedArray(data);
  const size = Math.max(4, blockSize);
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      let r = 0, g = 0, b = 0, count = 0;
      const cx = x + Math.floor(size / 2);
      const cy = y + Math.floor(size / 2);
      if (cx < width && cy < height) {
        const idx = (cy * width + cx) * 4;
        r = src[idx];
        g = src[idx + 1];
        b = src[idx + 2];
        count = 1;
      }
      if (count === 0) continue;
      for (let dy = 0; dy < size && y + dy < height; dy++) {
        for (let dx = 0; dx < size && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
    }
  }
}

export function applyFilter(
  imageData: ImageData,
  filterType: FilterType,
  options: FilterOptions = {}
): ImageData {
  if (filterType === 'none') {
    return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }

  const intensity = options.intensity ?? 1;
  const pixelSize = options.pixelSize ?? 8;
  const width = imageData.width;
  const height = imageData.height;
  const result = new ImageData(new Uint8ClampedArray(imageData.data), width, height);

  switch (filterType) {
    case 'oil':
      applyOil(result.data, width, height, intensity);
      break;
    case 'watercolor':
      applyWatercolor(result.data, width, height, intensity);
      break;
    case 'sketch':
      applySketch(result.data, width, height, intensity);
      break;
    case 'pixelate':
      applyPixelate(result.data, width, height, pixelSize);
      break;
    case 'neon':
      applyNeon(result.data, width, height, intensity);
      break;
    case 'mosaic':
      applyMosaic(result.data, width, height, pixelSize * 1.5);
      break;
  }

  return result;
}

export const FILTER_LIST: { type: FilterType; name: string; description: string }[] = [
  { type: 'none', name: '原图', description: '不应用滤镜' },
  { type: 'oil', name: '油画', description: '油画笔触效果' },
  { type: 'watercolor', name: '水彩', description: '水彩画效果' },
  { type: 'sketch', name: '素描', description: '铅笔素描效果' },
  { type: 'pixelate', name: '像素化', description: '像素块效果' },
  { type: 'neon', name: '霓虹', description: '发光边缘效果' },
  { type: 'mosaic', name: '马赛克', description: '方格马赛克' },
];
