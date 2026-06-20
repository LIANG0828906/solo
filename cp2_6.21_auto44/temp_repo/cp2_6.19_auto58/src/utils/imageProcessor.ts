export interface ProcessedImage {
  textureUrl: string;
  originalUrl: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cropToSquare(img: HTMLImageElement, size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const minDimension = Math.min(img.width, img.height);
  const sx = (img.width - minDimension) / 2;
  const sy = (img.height - minDimension) / 2;

  ctx.drawImage(
    img,
    sx, sy, minDimension, minDimension,
    0, 0, size, size
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const originalUrl = URL.createObjectURL(file);
  const img = await loadImage(originalUrl);

  const maxTextureSize = 2048;
  const size = Math.min(Math.min(img.width, img.height), maxTextureSize);

  const textureUrl = cropToSquare(img, size);

  return {
    textureUrl,
    originalUrl,
  };
}

export function revokeProcessedImage(processed: ProcessedImage): void {
  URL.revokeObjectURL(processed.originalUrl);
}
