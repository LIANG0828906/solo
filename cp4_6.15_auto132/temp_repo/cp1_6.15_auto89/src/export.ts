import { parseFilterComponents, FilterType } from './filter.js';
import { calculateAdaptiveFontSize } from './ui.js';

const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function applyFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  filter: FilterType,
  width: number,
  height: number
): void {
  const components = parseFilterComponents(filter);

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  const targetRatio = width / height;
  const sourceRatio = image.naturalWidth / image.naturalHeight;

  let sx: number;
  let sy: number;
  let sWidth: number;
  let sHeight: number;

  if (sourceRatio > targetRatio) {
    sHeight = image.naturalHeight;
    sWidth = sHeight * targetRatio;
    sx = (image.naturalWidth - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = image.naturalWidth;
    sHeight = sWidth / targetRatio;
    sx = 0;
    sy = (image.naturalHeight - sHeight) / 2;
  }

  tempCtx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, width, height);

  let imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (components.grayscale !== undefined) {
    const g = components.grayscale;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i] * (1 - g) + gray * g;
      data[i + 1] = data[i + 1] * (1 - g) + gray * g;
      data[i + 2] = data[i + 2] * (1 - g) + gray * g;
    }
  }

  if (components.sepia !== undefined && components.sepia > 0) {
    const s = components.sepia;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      data[i] = r * (1 - s) + sr * s;
      data[i + 1] = g * (1 - s) + sg * s;
      data[i + 2] = b * (1 - s) + sb * s;
    }
  }

  if (components.hueRotate !== undefined) {
    const rad = (components.hueRotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const matrix = [
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
      0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072,
    ];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      data[i] = Math.min(255, Math.max(0, r * matrix[0] + g * matrix[1] + b * matrix[2]));
      data[i + 1] = Math.min(255, Math.max(0, r * matrix[3] + g * matrix[4] + b * matrix[5]));
      data[i + 2] = Math.min(255, Math.max(0, r * matrix[6] + g * matrix[7] + b * matrix[8]));
    }
  }

  if (components.saturate !== undefined) {
    const s = components.saturate;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * s));
      data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * s));
      data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * s));
    }
  }

  if (components.brightness !== undefined) {
    const b = components.brightness;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * b));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * b));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * b));
    }
  }

  if (components.contrast !== undefined) {
    const c = components.contrast;
    const intercept = 128 * (1 - c);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * c + intercept));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * c + intercept));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * c + intercept));
    }
  }

  tempCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, 0, 0);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(/(\s+)/);
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;
      const testLine = currentLine + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine && !/^\s+$/.test(word)) {
        lines.push(currentLine);
        currentLine = /^\s+/.test(word) ? word.slice(1) : word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  const totalHeight = lines.length * lineHeight;
  let startY = y - totalHeight;

  for (const line of lines) {
    startY += lineHeight;
    const textWidth = ctx.measureText(line).width;
    const textX = x - textWidth / 2;
    ctx.strokeText(line, textX, startY);
    ctx.fillText(line, textX, startY);
  }

  return totalHeight;
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  baseFontSize: number
): void {
  if (!text) return;

  const adaptiveFontSize = calculateAdaptiveFontSize(canvasWidth, baseFontSize);
  const fontFamily = 'Impact, "Arial Black", "微软雅黑", sans-serif';
  const lineHeight = adaptiveFontSize * 1.6;

  const paddingX = canvasWidth * 0.08;
  const maxTextWidth = canvasWidth - paddingX * 2;
  const bottomY = canvasHeight * 0.92;

  ctx.font = `normal ${adaptiveFontSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';

  const strokeWidth = Math.max(2, adaptiveFontSize * 0.08);

  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = '#000000';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.fillStyle = '#ffffff';

  const centerX = canvasWidth / 2;

  const testCanvas = document.createElement('canvas');
  testCanvas.width = canvasWidth;
  testCanvas.height = canvasHeight;
  const testCtx = testCanvas.getContext('2d');
  if (testCtx) {
    testCtx.font = ctx.font;
    testCtx.textBaseline = ctx.textBaseline;
  }

  drawWrappedText(ctx, text, centerX, bottomY, maxTextWidth, lineHeight);
}

export async function exportCard(
  imageSrc: string,
  quote: string,
  filter: FilterType,
  fontSize: number
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文');
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  applyFilterToCanvas(ctx, image, filter, EXPORT_WIDTH, EXPORT_HEIGHT);

  drawSubtitle(ctx, quote, EXPORT_WIDTH, EXPORT_HEIGHT, fontSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('导出图片失败'));
        }
      },
      'image/png',
      1.0
    );
  });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function generateTimestampFilename(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `cinequote_${ts}.png`;
}
