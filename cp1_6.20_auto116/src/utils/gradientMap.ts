import type { HSLColor, RGBColor } from '../types/color';
import { hslToRgb, rgbToHsl, clampHsl } from './colorUtils';

export const rgbToLuminance = (r: number, g: number, b: number): number => {
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

export const getPixelLuminance = (imageData: ImageData, x: number, y: number): number => {
  const idx = (y * imageData.width + x) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];
  return rgbToLuminance(r, g, b);
};

export const createGradientLookup = (colors: HSLColor[], steps: number = 256): RGBColor[] => {
  const lookup: RGBColor[] = [];

  if (colors.length === 0) {
    for (let i = 0; i < steps; i++) {
      lookup.push({ r: i, g: i, b: i });
    }
    return lookup;
  }

  if (colors.length === 1) {
    const rgb = hslToRgb(colors[0]);
    for (let i = 0; i < steps; i++) {
      lookup.push(rgb);
    }
    return lookup;
  }

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const segment = t * (colors.length - 1);
    const segmentIdx = Math.min(Math.floor(segment), colors.length - 2);
    const segmentT = segment - segmentIdx;

    const start = colors[segmentIdx];
    const end = colors[segmentIdx + 1];

    const startRgb = hslToRgb(start);
    const endRgb = hslToRgb(end);

    lookup.push({
      r: Math.round(startRgb.r + (endRgb.r - startRgb.r) * segmentT),
      g: Math.round(startRgb.g + (endRgb.g - startRgb.g) * segmentT),
      b: Math.round(startRgb.b + (endRgb.b - startRgb.b) * segmentT),
    });
  }

  return lookup;
};

export const createPerceptualGradientLookup = (colors: HSLColor[], steps: number = 256): RGBColor[] => {
  const lookup: RGBColor[] = [];

  if (colors.length === 0) {
    for (let i = 0; i < steps; i++) {
      lookup.push({ r: i, g: i, b: i });
    }
    return lookup;
  }

  if (colors.length === 1) {
    const rgb = hslToRgb(colors[0]);
    for (let i = 0; i < steps; i++) {
      lookup.push(rgb);
    }
    return lookup;
  }

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const segment = t * (colors.length - 1);
    const segmentIdx = Math.min(Math.floor(segment), colors.length - 2);
    const segmentT = segment - segmentIdx;

    const start = colors[segmentIdx];
    const end = colors[segmentIdx + 1];

    const startHsl = rgbToHsl(hslToRgb(start));
    const endHsl = rgbToHsl(hslToRgb(end));

    let hDiff = endHsl.h - startHsl.h;
    if (Math.abs(hDiff) > 180) {
      hDiff = hDiff > 0 ? hDiff - 360 : hDiff + 360;
    }

    const interpolated = clampHsl({
      h: ((startHsl.h + hDiff * segmentT) % 360 + 360) % 360,
      s: startHsl.s + (endHsl.s - startHsl.s) * segmentT,
      l: startHsl.l + (endHsl.l - startHsl.l) * segmentT,
    });

    lookup.push(hslToRgb(interpolated));
  }

  return lookup;
};

export const applyGradientMap = (
  imageData: ImageData,
  gradientColors: HSLColor[],
  preserveLuminance: boolean = true
): ImageData => {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  const lookup = createPerceptualGradientLookup(gradientColors, 256);
  const data = result.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const luminance = rgbToLuminance(r, g, b);
    const lookupIdx = Math.min(255, Math.max(0, Math.round(luminance)));
    const mappedColor = lookup[lookupIdx];

    if (preserveLuminance) {
      const mappedLuminance = rgbToLuminance(mappedColor.r, mappedColor.g, mappedColor.b);
      const luminanceRatio = mappedLuminance > 0 ? luminance / mappedLuminance : 1;

      data[i] = Math.min(255, Math.max(0, Math.round(mappedColor.r * luminanceRatio)));
      data[i + 1] = Math.min(255, Math.max(0, Math.round(mappedColor.g * luminanceRatio)));
      data[i + 2] = Math.min(255, Math.max(0, Math.round(mappedColor.b * luminanceRatio)));
    } else {
      data[i] = mappedColor.r;
      data[i + 1] = mappedColor.g;
      data[i + 2] = mappedColor.b;
    }
  }

  return result;
};

export const applyGradientMapChunked = (
  imageData: ImageData,
  gradientColors: HSLColor[],
  preserveLuminance: boolean = true,
  chunkSize: number = 10000,
  onProgress?: (progress: number) => void
): Promise<ImageData> => {
  return new Promise((resolve) => {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    const lookup = createPerceptualGradientLookup(gradientColors, 256);
    const data = result.data;
    const totalPixels = data.length / 4;
    let processed = 0;

    const processChunk = () => {
      const end = Math.min(processed + chunkSize, totalPixels);

      for (let p = processed; p < end; p++) {
        const i = p * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const luminance = rgbToLuminance(r, g, b);
        const lookupIdx = Math.min(255, Math.max(0, Math.round(luminance)));
        const mappedColor = lookup[lookupIdx];

        if (preserveLuminance) {
          const mappedLuminance = rgbToLuminance(mappedColor.r, mappedColor.g, mappedColor.b);
          const luminanceRatio = mappedLuminance > 0 ? luminance / mappedLuminance : 1;

          data[i] = Math.min(255, Math.max(0, Math.round(mappedColor.r * luminanceRatio)));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(mappedColor.g * luminanceRatio)));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(mappedColor.b * luminanceRatio)));
        } else {
          data[i] = mappedColor.r;
          data[i + 1] = mappedColor.g;
          data[i + 2] = mappedColor.b;
        }
      }

      processed = end;

      if (onProgress) {
        onProgress(processed / totalPixels);
      }

      if (processed < totalPixels) {
        requestAnimationFrame(processChunk);
      } else {
        resolve(result);
      }
    };

    requestAnimationFrame(processChunk);
  });
};

export const resizeImageData = (
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;

  tempCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  return tempCtx.getImageData(0, 0, targetWidth, targetHeight);
};

export const fitImageToBounds = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  return {
    width: Math.round(img.width * ratio),
    height: Math.round(img.height * ratio),
  };
};
