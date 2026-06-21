import type { StyleType, FilterParams } from '../types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function applyBrightnessAndSaturation(
  data: Uint8ClampedArray,
  brightness: number,
  saturation: number
): void {
  const brightnessFactor = brightness / 50;
  const saturationFactor = 1 + saturation / 50;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = clamp(r + brightnessFactor * 255, 0, 255);
    g = clamp(g + brightnessFactor * 255, 0, 255);
    b = clamp(b + brightnessFactor * 255, 0, 255);

    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    r = clamp(gray + (r - gray) * saturationFactor, 0, 255);
    g = clamp(gray + (g - gray) * saturationFactor, 0, 255);
    b = clamp(gray + (b - gray) * saturationFactor, 0, 255);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

function blendIntensity(
  original: Uint8ClampedArray,
  filtered: Uint8ClampedArray,
  intensity: number
): Uint8ClampedArray {
  const factor = intensity / 100;
  const result = new Uint8ClampedArray(original.length);

  for (let i = 0; i < original.length; i += 4) {
    result[i] = clamp(original[i] + (filtered[i] - original[i]) * factor, 0, 255);
    result[i + 1] = clamp(original[i + 1] + (filtered[i + 1] - original[i + 1]) * factor, 0, 255);
    result[i + 2] = clamp(original[i + 2] + (filtered[i + 2] - original[i + 2]) * factor, 0, 255);
    result[i + 3] = original[i + 3];
  }

  return result;
}

function boxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
      }

      const idx = (y * width + x) * 4;
      result[idx] = r / count;
      result[idx + 1] = g / count;
      result[idx + 2] = b / count;
      result[idx + 3] = data[idx + 3];
    }
  }

  return result;
}

export function applyOilFilter(source: ImageData): ImageData {
  const { width, height, data } = source;
  const result = new Uint8ClampedArray(data.length);
  const radius = 3;
  const intensityLevels = 20;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const intensityCount = new Array(intensityLevels).fill(0);
      const rSum = new Array(intensityLevels).fill(0);
      const gSum = new Array(intensityLevels).fill(0);
      const bSum = new Array(intensityLevels).fill(0);

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const intensity = Math.floor(((r + g + b) / 3) * intensityLevels / 256);
            intensityCount[intensity]++;
            rSum[intensity] += r;
            gSum[intensity] += g;
            bSum[intensity] += b;
          }
        }
      }

      let maxIdx = 0;
      let maxCount = 0;
      for (let i = 0; i < intensityLevels; i++) {
        if (intensityCount[i] > maxCount) {
          maxCount = intensityCount[i];
          maxIdx = i;
        }
      }

      const idx = (y * width + x) * 4;
      result[idx] = rSum[maxIdx] / maxCount;
      result[idx + 1] = gSum[maxIdx] / maxCount;
      result[idx + 2] = bSum[maxIdx] / maxCount;
      result[idx + 3] = data[idx + 3];
    }
  }

  for (let i = 0; i < result.length; i += 4) {
    result[i] = clamp(result[i] * 1.1, 0, 255);
    result[i + 1] = clamp(result[i + 1] * 1.05, 0, 255);
    result[i + 2] = clamp(result[i + 2] * 0.95, 0, 255);
  }

  return new ImageData(result, width, height);
}

export function applyWatercolorFilter(source: ImageData): ImageData {
  const { width, height, data } = source;
  const blurred = boxBlur(data, width, height, 2);
  const result = new Uint8ClampedArray(blurred.length);

  const levels = 16;
  for (let i = 0; i < blurred.length; i += 4) {
    result[i] = Math.floor(blurred[i] / (256 / levels)) * (256 / levels);
    result[i + 1] = Math.floor(blurred[i + 1] / (256 / levels)) * (256 / levels);
    result[i + 2] = Math.floor(blurred[i + 2] / (256 / levels)) * (256 / levels);
    result[i + 3] = blurred[i + 3];
  }

  const moreBlurred = boxBlur(result, width, height, 1);

  for (let i = 0; i < moreBlurred.length; i += 4) {
    moreBlurred[i] = clamp(moreBlurred[i] * 1.15, 0, 255);
    moreBlurred[i + 1] = clamp(moreBlurred[i + 1] * 1.1, 0, 255);
    moreBlurred[i + 2] = clamp(moreBlurred[i + 2] * 1.2, 0, 255);
  }

  const finalData = new Uint8ClampedArray(moreBlurred);
  return new ImageData(finalData, width, height);
}

export function applySketchFilter(source: ImageData): ImageData {
  const { width, height, data } = source;
  const result = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    result[i] = gray;
    result[i + 1] = gray;
    result[i + 2] = gray;
    result[i + 3] = data[i + 3];
  }

  const inverted = new Uint8ClampedArray(result.length);
  for (let i = 0; i < result.length; i += 4) {
    inverted[i] = 255 - result[i];
    inverted[i + 1] = 255 - result[i + 1];
    inverted[i + 2] = 255 - result[i + 2];
    inverted[i + 3] = result[i + 3];
  }

  const blurredInverted = boxBlur(inverted, width, height, 8);
  const final = new Uint8ClampedArray(result.length);

  for (let i = 0; i < result.length; i += 4) {
    const base = result[i];
    const blur = blurredInverted[i];
    const dodge = clamp((base * 255) / (256 - blur), 0, 255);
    final[i] = dodge;
    final[i + 1] = dodge;
    final[i + 2] = dodge;
    final[i + 3] = result[i + 3];
  }

  return new ImageData(final, width, height);
}

export function applyCyberpunkFilter(source: ImageData): ImageData {
  const { width, height, data } = source;
  const result = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      r = clamp(r * 0.8 + b * 0.4, 0, 255);
      g = clamp(g * 0.7 + r * 0.3, 0, 255);
      b = clamp(b * 1.3 + r * 0.2, 0, 255);

      const brightness = (r + g + b) / 3;
      if (brightness > 128) {
        r = clamp(r * 1.2, 0, 255);
        g = clamp(g * 0.9, 0, 255);
        b = clamp(b * 1.4, 0, 255);
      } else {
        r = clamp(r * 0.9, 0, 255);
        g = clamp(g * 1.1, 0, 255);
        b = clamp(b * 1.2, 0, 255);
      }

      r = clamp((r - 128) * 1.3 + 128, 0, 255);
      g = clamp((g - 128) * 1.1 + 128, 0, 255);
      b = clamp((b - 128) * 1.4 + 128, 0, 255);

      result[idx] = r;
      result[idx + 1] = g;
      result[idx + 2] = b;
      result[idx + 3] = data[idx + 3];
    }
  }

  return new ImageData(result, width, height);
}

export function applyFilter(
  source: ImageData,
  style: StyleType,
  params: FilterParams
): ImageData {
  const originalCopy = new Uint8ClampedArray(source.data);

  let filteredImageData: ImageData;

  switch (style) {
    case 'oil':
      filteredImageData = applyOilFilter(source);
      break;
    case 'watercolor':
      filteredImageData = applyWatercolorFilter(source);
      break;
    case 'sketch':
      filteredImageData = applySketchFilter(source);
      break;
    case 'cyberpunk':
      filteredImageData = applyCyberpunkFilter(source);
      break;
    default:
      filteredImageData = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  }

  const blendedData = blendIntensity(originalCopy, filteredImageData.data, params.intensity);

  applyBrightnessAndSaturation(blendedData, params.brightness, params.saturation);

  const finalResult = new Uint8ClampedArray(blendedData);
  return new ImageData(finalResult, source.width, source.height);
}
