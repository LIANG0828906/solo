import { FilterConfig } from '../types';

export function applyPixelFilter(
  imageData: ImageData,
  filterConfig: FilterConfig
): ImageData {
  const data = imageData.data;
  const { brightness, contrast, hue, saturation } = filterConfig;

  const brightnessFactor = (brightness + 100) / 100;
  const contrastFactor = (contrast + 100) / 100;
  const saturationFactor = (saturation + 100) / 100;
  const hueRad = (hue * Math.PI) / 180;

  const cosH = Math.cos(hueRad);
  const sinH = Math.sin(hueRad);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = r * brightnessFactor;
    g = g * brightnessFactor;
    b = b * brightnessFactor;

    r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
    g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
    b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

    if (hue !== 0) {
      const newR = r * (0.213 + cosH * 0.787 - sinH * 0.213) +
                   g * (0.715 - cosH * 0.715 - sinH * 0.715) +
                   b * (0.072 - cosH * 0.072 + sinH * 0.928);
      const newG = r * (0.213 - cosH * 0.213 + sinH * 0.143) +
                   g * (0.715 + cosH * 0.285 + sinH * 0.140) +
                   b * (0.072 - cosH * 0.072 - sinH * 0.283);
      const newB = r * (0.213 - cosH * 0.213 - sinH * 0.787) +
                   g * (0.715 - cosH * 0.715 + sinH * 0.715) +
                   b * (0.072 + cosH * 0.928 + sinH * 0.072);
      r = newR;
      g = newG;
      b = newB;
    }

    if (saturation !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  return imageData;
}
