import type { AspectRatio } from '@/types';

export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function getAspectRatioDimensions(
  ratio: AspectRatio,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  const aspect = w / h;
  
  let width = maxWidth;
  let height = width / aspect;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  
  return { width, height };
}

export async function cropImage(
  sourceImage: string,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  targetWidth: number,
  targetHeight: number
): Promise<{ original: string; thumbnail: string }> {
  const img = await loadImage(sourceImage);
  
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );
  
  const original = canvas.toDataURL('image/png', 0.95);
  
  const thumbCanvas = document.createElement('canvas');
  const thumbWidth = 400;
  const thumbHeight = (thumbWidth / targetWidth) * targetHeight;
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d')!;
  
  thumbCtx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    thumbWidth,
    thumbHeight
  );
  
  const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.8);
  
  return { original, thumbnail };
}

export async function captureViewport(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  ctx.fillStyle = '#F5F0EB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#E8E0D8');
  gradient.addColorStop(0.5, '#F5F0EB');
  gradient.addColorStop(1, '#E0D8D0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#1A2744';
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('页面截图预览', canvas.width / 2, canvas.height / 2 - 60);
  
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('浏览器扩展截图功能模拟', canvas.width / 2, canvas.height / 2);
  
  for (let i = 0; i < 5; i++) {
    const rectX = 100 + i * 160;
    const rectY = canvas.height / 2 + 80;
    const hue = (i * 60) % 360;
    ctx.fillStyle = `hsla(${hue}, 60%, 70%, 0.6)`;
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, 120, 80, 8);
    ctx.fill();
  }
  
  return canvas.toDataURL('image/png');
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 20 * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG、PNG、WebP 格式' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 20MB' };
  }
  
  return { valid: true };
}
