export type FilterType = 'original' | 'pixelate' | 'edge' | 'vintage';

export interface FilterOptions {
  brightness: number;
  contrast: number;
  pixelSize: number;
}

const defaultOptions: FilterOptions = {
  brightness: 0,
  contrast: 1,
  pixelSize: 8
};

export function applyFilter(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  filter: FilterType,
  options: Partial<FilterOptions> = {}
): ImageData {
  const opts = { ...defaultOptions, ...options };
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  switch (filter) {
    case 'pixelate':
      return applyPixelate(ctx, imageData, opts);
    case 'edge':
      return applyEdgeDetection(imageData, opts);
    case 'vintage':
      return applyVintage(imageData, opts);
    case 'original':
    default:
      return applyBrightnessContrast(imageData, opts);
  }
}

function applyBrightnessContrast(
  imageData: ImageData,
  options: FilterOptions
): ImageData {
  const data = imageData.data;
  const brightness = options.brightness * 2.55;
  const contrast = options.contrast;
  const intercept = 128 * (1 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * contrast + intercept + brightness);
    data[i + 1] = clamp(data[i + 1] * contrast + intercept + brightness);
    data[i + 2] = clamp(data[i + 2] * contrast + intercept + brightness);
  }

  return imageData;
}

function applyPixelate(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  options: FilterOptions
): ImageData {
  const pixelSize = options.pixelSize;
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      const blockWidth = Math.min(pixelSize, width - x);
      const blockHeight = Math.min(pixelSize, height - y);

      let r = 0, g = 0, b = 0, a = 0;
      let count = 0;

      for (let dy = 0; dy < blockHeight; dy++) {
        for (let dx = 0; dx < blockWidth; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);

      const brightness = options.brightness * 2.55;
      const contrast = options.contrast;
      const intercept = 128 * (1 - contrast);

      r = clamp(r * contrast + intercept + brightness);
      g = clamp(g * contrast + intercept + brightness);
      b = clamp(b * contrast + intercept + brightness);

      for (let dy = 0; dy < blockHeight; dy++) {
        for (let dx = 0; dx < blockWidth; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  return imageData;
}

function applyEdgeDetection(
  imageData: ImageData,
  options: FilterOptions
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const output = new Uint8ClampedArray(src.length);

  for (let i = 0; i < src.length; i += 4) {
    const gray = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    output[i] = gray;
    output[i + 1] = gray;
    output[i + 2] = gray;
    output[i + 3] = src[i + 3];
  }

  const result = new Uint8ClampedArray(src.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      const gx =
        -output[((y - 1) * width + (x - 1)) * 4] +
        output[((y - 1) * width + (x + 1)) * 4] +
        -2 * output[(y * width + (x - 1)) * 4] +
        2 * output[(y * width + (x + 1)) * 4] +
        -output[((y + 1) * width + (x - 1)) * 4] +
        output[((y + 1) * width + (x + 1)) * 4];

      const gy =
        -output[((y - 1) * width + (x - 1)) * 4] +
        -2 * output[((y - 1) * width + x) * 4] +
        -output[((y - 1) * width + (x + 1)) * 4] +
        output[((y + 1) * width + (x - 1)) * 4] +
        2 * output[((y + 1) * width + x) * 4] +
        output[((y + 1) * width + (x + 1)) * 4];

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const edge = Math.min(255, magnitude);

      const brightness = options.brightness * 2.55;
      const contrast = options.contrast;
      const intercept = 128 * (1 - contrast);

      const final = clamp(edge * contrast + intercept + brightness);

      result[idx] = final;
      result[idx + 1] = final;
      result[idx + 2] = final;
      result[idx + 3] = 255;
    }
  }

  for (let i = 0; i < result.length; i++) {
    imageData.data[i] = result[i];
  }

  return imageData;
}

function applyVintage(
  imageData: ImageData,
  options: FilterOptions
): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  const brightness = options.brightness * 2.55;
  const contrast = options.contrast;
  const intercept = 128 * (1 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = r * 1.1 + 20;
    g = g * 0.95 + 10;
    b = b * 0.8 - 10;

    const avg = (r + g + b) / 3;
    r = avg * 1.1 + (r - avg) * 0.7;
    g = avg * 1.0 + (g - avg) * 0.7;
    b = avg * 0.8 + (b - avg) * 0.7;

    r = clamp(r * contrast + intercept + brightness);
    g = clamp(g * contrast + intercept + brightness);
    b = clamp(b * contrast + intercept + brightness);

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.03) {
        const idx = (y * width + x) * 4;
        const noise = (Math.random() - 0.5) * 30;
        data[idx] = clamp(data[idx] + noise);
        data[idx + 1] = clamp(data[idx + 1] + noise);
        data[idx + 2] = clamp(data[idx + 2] + noise);
      }
    }
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vignette = Math.max(0, 1 - (dist / maxDist) * 0.8);

      const idx = (y * width + x) * 4;
      data[idx] = clamp(data[idx] * vignette);
      data[idx + 1] = clamp(data[idx + 1] * vignette);
      data[idx + 2] = clamp(data[idx + 2] * vignette);
    }
  }

  return imageData;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function blendImageData(
  src1: ImageData,
  src2: ImageData,
  t: number
): ImageData {
  const data1 = src1.data;
  const data2 = src2.data;
  const result = new ImageData(src1.width, src1.height);
  const resultData = result.data;

  for (let i = 0; i < data1.length; i += 4) {
    resultData[i] = Math.round(data1[i] * (1 - t) + data2[i] * t);
    resultData[i + 1] = Math.round(data1[i + 1] * (1 - t) + data2[i + 1] * t);
    resultData[i + 2] = Math.round(data1[i + 2] * (1 - t) + data2[i + 2] * t);
    resultData[i + 3] = Math.round(data1[i + 3] * (1 - t) + data2[i + 3] * t);
  }

  return result;
}
