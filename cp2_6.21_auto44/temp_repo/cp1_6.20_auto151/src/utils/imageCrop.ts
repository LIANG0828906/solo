import type { CropArea } from '../types';

export const CROP_RATIO = 1 / 1.4;

export function computeDefaultCropArea(
  imgWidth: number,
  imgHeight: number
): CropArea {
  const targetRatio = CROP_RATIO;
  const imgRatio = imgWidth / imgHeight;

  let width: number;
  let height: number;

  if (imgRatio > targetRatio) {
    height = 1;
    width = targetRatio * (imgHeight / imgWidth);
  } else {
    width = 1;
    height = (imgWidth / targetRatio) / imgHeight;
  }

  const x = (1 - width) / 2;
  const y = (1 - height) / 2;

  return { x, y, width, height };
}

export function clampCropArea(area: CropArea): CropArea {
  let { x, y, width, height } = area;

  height = width * 1.4;

  if (width > 1) width = 1;
  if (height > 1) {
    height = 1;
    width = height * CROP_RATIO;
  }

  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + width > 1) x = 1 - width;
  if (y + height > 1) y = 1 - height;

  return { x, y, width, height };
}

export function getCroppedImage(
  source: HTMLImageElement | HTMLCanvasElement,
  crop: CropArea
): HTMLCanvasElement {
  const srcW =
    source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH =
    source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const sx = crop.x * srcW;
  const sy = crop.y * srcH;
  const sw = crop.width * srcW;
  const sh = crop.height * srcH;

  const outW = 500;
  const outH = Math.round(outW * 1.4);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas;
}

export function validateFile(file: File): { ok: boolean; message?: string } {
  const maxSize = 10 * 1024 * 1024;
  if (!/^image\/(jpeg|png|jpg)$/i.test(file.type)) {
    return { ok: false, message: '仅支持上传 JPG 或 PNG 格式图片' };
  }
  if (file.size > maxSize) {
    return { ok: false, message: '图片大小不能超过 10MB' };
  }
  return { ok: true };
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
