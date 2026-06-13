import { FilterConfig } from './types';

export function applyFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: FilterConfig[],
  transitionAlpha: number = 1
): void {
  const enabledFilters = filters.filter((f) => f.enabled);
  if (enabledFilters.length === 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);

  for (const filter of enabledFilters) {
    const alpha = filter.id === enabledFilters[enabledFilters.length - 1].id
      ? transitionAlpha
      : 1;
    applySingleFilter(data, original, filter, width, height, alpha);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applySingleFilter(
  data: Uint8ClampedArray,
  original: Uint8ClampedArray,
  filter: FilterConfig,
  width: number,
  height: number,
  alpha: number
): void {
  switch (filter.id) {
    case 'pixelate':
      applyPixelate(data, filter.intensity, width, height, alpha);
      break;
    case 'posterize':
      applyPosterize(data, filter.intensity, alpha);
      break;
    case 'watercolor':
      applyWatercolor(data, original, filter.intensity / 100, width, height, alpha);
      break;
    case 'grain':
      applyGrain(data, filter.intensity / 100, alpha);
      break;
    case 'glitch':
      applyGlitch(data, original, filter.intensity / 100, width, height, alpha);
      break;
    case 'vignette':
      applyVignette(data, filter.intensity / 100, width, height, alpha);
      break;
    case 'chromatic':
      applyChromatic(data, filter.intensity / 100, alpha);
      break;
    case 'scanline':
      applyScanline(data, filter.intensity / 100, width, height, alpha);
      break;
  }
}

function applyPixelate(
  data: Uint8ClampedArray,
  blockSize: number,
  width: number,
  height: number,
  alpha: number
): void {
  const bs = Math.max(2, Math.floor(blockSize));
  for (let y = 0; y < height; y += bs) {
    for (let x = 0; x < width; x += bs) {
      let r = 0, g = 0, b = 0, count = 0;
      const blockH = Math.min(bs, height - y);
      const blockW = Math.min(bs, width - x);
      for (let dy = 0; dy < blockH; dy++) {
        for (let dx = 0; dx < blockW; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      for (let dy = 0; dy < blockH; dy++) {
        for (let dx = 0; dx < blockW; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = lerp(data[idx], r, alpha);
          data[idx + 1] = lerp(data[idx + 1], g, alpha);
          data[idx + 2] = lerp(data[idx + 2], b, alpha);
        }
      }
    }
  }
}

function applyPosterize(data: Uint8ClampedArray, levels: number, alpha: number): void {
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    const pr = Math.round(Math.round(data[i] / step) * step);
    const pg = Math.round(Math.round(data[i + 1] / step) * step);
    const pb = Math.round(Math.round(data[i + 2] / step) * step);
    data[i] = lerp(data[i], pr, alpha);
    data[i + 1] = lerp(data[i + 1], pg, alpha);
    data[i + 2] = lerp(data[i + 2], pb, alpha);
  }
}

function applyWatercolor(
  data: Uint8ClampedArray,
  original: Uint8ClampedArray,
  intensity: number,
  width: number,
  height: number,
  alpha: number
): void {
  const radius = Math.max(1, Math.floor(intensity * 4));
  const temp = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy += 2) {
        for (let dx = -radius; dx <= radius; dx += 2) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += temp[idx];
            g += temp[idx + 1];
            b += temp[idx + 2];
            count++;
          }
        }
      }
      const idx = (y * width + x) * 4;
      const wr = Math.floor(r / count);
      const wg = Math.floor(g / count);
      const wb = Math.floor(b / count);
      const variation = 1 + (Math.sin(x * 0.3) + Math.cos(y * 0.2)) * 0.05 * intensity;
      data[idx] = clampByte(lerp(data[idx], wr * variation, alpha));
      data[idx + 1] = clampByte(lerp(data[idx + 1], wg * variation, alpha));
      data[idx + 2] = clampByte(lerp(data[idx + 2], wb * variation, alpha));
    }
  }
}

function applyGrain(data: Uint8ClampedArray, intensity: number, alpha: number): void {
  const amp = intensity * 60;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amp;
    data[i] = clampByte(lerp(data[i], data[i] + noise, alpha));
    data[i + 1] = clampByte(lerp(data[i + 1], data[i + 1] + noise, alpha));
    data[i + 2] = clampByte(lerp(data[i + 2], data[i + 2] + noise, alpha));
  }
}

function applyGlitch(
  data: Uint8ClampedArray,
  original: Uint8ClampedArray,
  intensity: number,
  width: number,
  height: number,
  alpha: number
): void {
  const shift = Math.floor(intensity * 15);
  for (let y = 0; y < height; y++) {
    const rowShift = Math.random() < 0.3 * intensity ? Math.floor((Math.random() - 0.5) * shift * 2) : 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const rx = clamp((x + shift + rowShift) % width, 0, width - 1);
      const bx = clamp((x - shift + rowShift + width) % width, 0, width - 1);
      const rIdx = (y * width + rx) * 4;
      const bIdx = (y * width + bx) * 4;
      data[idx] = clampByte(lerp(data[idx], original[rIdx], alpha));
      data[idx + 2] = clampByte(lerp(data[idx + 2], original[bIdx], alpha));
    }
  }
}

function applyVignette(
  data: Uint8ClampedArray,
  intensity: number,
  width: number,
  height: number,
  alpha: number
): void {
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const dark = 1 - Math.pow(dist, 2) * intensity;
      const idx = (y * width + x) * 4;
      data[idx] = clampByte(lerp(data[idx], data[idx] * dark, alpha));
      data[idx + 1] = clampByte(lerp(data[idx + 1], data[idx + 1] * dark, alpha));
      data[idx + 2] = clampByte(lerp(data[idx + 2], data[idx + 2] * dark, alpha));
    }
  }
}

function applyChromatic(data: Uint8ClampedArray, intensity: number, alpha: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const shadowFactor = Math.pow(1 - luminance, 2);
    const highlightFactor = Math.pow(luminance, 2);
    const nr = r + (0.9 * highlightFactor - 0.1 * shadowFactor) * intensity;
    const ng = g + (-0.05 * highlightFactor + 0.15 * shadowFactor) * intensity;
    const nb = b + (-0.3 * highlightFactor + 0.9 * shadowFactor) * intensity;
    data[i] = clampByte(lerp(data[i], nr * 255, alpha));
    data[i + 1] = clampByte(lerp(data[i + 1], ng * 255, alpha));
    data[i + 2] = clampByte(lerp(data[i + 2], nb * 255, alpha));
  }
}

function applyScanline(
  data: Uint8ClampedArray,
  intensity: number,
  width: number,
  height: number,
  alpha: number
): void {
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dark = 1 - 0.6 * intensity;
      data[idx] = clampByte(lerp(data[idx], data[idx] * dark, alpha));
      data[idx + 1] = clampByte(lerp(data[idx + 1], data[idx + 1] * dark, alpha));
      data[idx + 2] = clampByte(lerp(data[idx + 2], data[idx + 2] * dark, alpha));
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function clampByte(v: number): number {
  return clamp(Math.round(v), 0, 255);
}

