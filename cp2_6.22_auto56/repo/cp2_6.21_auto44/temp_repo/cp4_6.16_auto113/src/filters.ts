import type { FilterType } from './types';

export function applyFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterType: FilterType
): void {
  if (filterType === 'none') return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  switch (filterType) {
    case 'gaussianBlur':
      applyGaussianBlur(data, width, height);
      break;
    case 'sepia':
      applySepia(data);
      break;
    case 'neon':
      applyNeon(data, width, height);
      break;
  }

  ctx.putImageData(imageData, 0, 0);
}

function applySepia(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
    const tb = 0.272 * r + 0.534 * g + 0.131 * b;

    data[i] = Math.min(255, tr);
    data[i + 1] = Math.min(255, tg);
    data[i + 2] = Math.min(255, tb);
  }
}

function applyGaussianBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const temp = new Uint8ClampedArray(data);
  const radius = 3;
  const sigma = radius / 2;
  const kernel: number[] = [];
  let sum = 0;

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      kernel.push(value);
      sum += value;
    }
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i]! /= sum;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let ki = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (py * width + px) * 4;
          const k = kernel[ki]!;

          r += temp[idx]! * k;
          g += temp[idx + 1]! * k;
          b += temp[idx + 2]! * k;
          a += temp[idx + 3]! * k;
          ki++;
        }
      }

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
}

function applyNeon(
  data: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const temp = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const r = temp[idx]!;
      const g = temp[idx + 1]!;
      const b = temp[idx + 2]!;
      const a = temp[idx + 3]!;

      if (a < 10) continue;

      const brightness = (r + g + b) / 3;

      const neonR = Math.min(255, r * 1.2 + brightness * 0.3);
      const neonG = Math.min(255, g * 0.8 + 100);
      const neonB = Math.min(255, b * 1.5 + 50);

      let glowR = 0,
        glowG = 0,
        glowB = 0;
      const glowRadius = 4;
      let count = 0;

      for (let dy = -glowRadius; dy <= glowRadius; dy++) {
        for (let dx = -glowRadius; dx <= glowRadius; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          const pidx = (py * width + px) * 4;
          if (temp[pidx + 3]! > 50) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            const factor = Math.max(0, 1 - dist / glowRadius);
            glowR += temp[pidx]! * factor * 0.5;
            glowG += temp[pidx + 1]! * factor * 0.5;
            glowB += temp[pidx + 2]! * factor * 0.5;
            count++;
          }
        }
      }

      if (count > 0) {
        data[idx] = Math.min(255, neonR + glowR / count);
        data[idx + 1] = Math.min(255, neonG + glowG / count);
        data[idx + 2] = Math.min(255, neonB + glowB / count);
      } else {
        data[idx] = neonR;
        data[idx + 1] = neonG;
        data[idx + 2] = neonB;
      }
    }
  }
}
