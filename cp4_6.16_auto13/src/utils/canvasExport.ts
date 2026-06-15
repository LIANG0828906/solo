import { saveAs } from 'file-saver';
import type { CanvasElement, TextElement, ImageElement, ColorTheme } from '@/types';

const CANVAS_W = 1080;
const CANVAS_H = 1920;

function resolveColor(el: TextElement, theme: ColorTheme): string {
  if (el.colorKey === 'custom' && el.customColor) return el.customColor;
  if (el.colorKey === 'primary') return theme.colors.primary;
  if (el.colorKey === 'secondary') return theme.colors.secondary;
  return theme.colors.background;
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

export async function exportPosterToBlob(
  elements: CanvasElement[],
  bgColor: string,
  theme: ColorTheme
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sorted) {
    ctx.save();
    ctx.globalAlpha = el.opacity;
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    if (el.type === 'text') {
      const t = el as TextElement;
      const color = resolveColor(t, theme);
      ctx.fillStyle = color;
      const fontStyle = `${t.fontWeight} ${t.fontSize}px "${t.fontFamily}", sans-serif`;
      ctx.font = fontStyle;
      ctx.textBaseline = 'top';

      const lines = t.content.split('\n');
      const lineHeightPx = t.fontSize * t.lineHeight;
      const totalTextHeight = lines.length * lineHeightPx;
      const startY = el.y + (el.height - totalTextHeight) / 2;

      ctx.textAlign = t.textAlign;
      const textX =
        t.textAlign === 'left'
          ? el.x
          : t.textAlign === 'right'
          ? el.x + el.width
          : el.x + el.width / 2;

      lines.forEach((line, idx) => {
        ctx.fillText(line, textX, startY + idx * lineHeightPx);
      });
    } else {
      const img = el as ImageElement;
      try {
        const loadedImg = await loadImage(img.src);
        const r = img.borderRadius;
        if (r > 0) {
          ctx.beginPath();
          const x = img.x;
          const y = img.y;
          const w = img.width;
          const h = img.height;
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + w, y, x + w, y + h, r);
          ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r);
          ctx.arcTo(x, y, x + w, y, r);
          ctx.closePath();
          ctx.clip();
        }

        if (img.objectFit === 'contain') {
          const ratio = Math.min(img.width / loadedImg.width, img.height / loadedImg.height);
          const w = loadedImg.width * ratio;
          const h = loadedImg.height * ratio;
          const dx = img.x + (img.width - w) / 2;
          const dy = img.y + (img.height - h) / 2;
          ctx.drawImage(loadedImg, dx, dy, w, h);
        } else if (img.objectFit === 'cover') {
          const ratio = Math.max(img.width / loadedImg.width, img.height / loadedImg.height);
          const w = loadedImg.width * ratio;
          const h = loadedImg.height * ratio;
          const dx = img.x + (img.width - w) / 2;
          const dy = img.y + (img.height - h) / 2;
          ctx.drawImage(loadedImg, dx, dy, w, h);
        } else {
          ctx.drawImage(loadedImg, img.x, img.y, img.width, img.height);
        }
      } catch {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(img.x, img.y, img.width, img.height);
      }
    }

    ctx.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, 'image/png');
  });
}

export async function downloadPoster(
  elements: CanvasElement[],
  bgColor: string,
  theme: ColorTheme,
  filename = 'poster.png'
): Promise<void> {
  const blob = await exportPosterToBlob(elements, bgColor, theme);
  saveAs(blob, filename);
}

export async function generateThumbnailDataURL(
  elements: CanvasElement[],
  bgColor: string,
  theme: ColorTheme
): Promise<string> {
  const blob = await exportPosterToBlob(elements, bgColor, theme);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
