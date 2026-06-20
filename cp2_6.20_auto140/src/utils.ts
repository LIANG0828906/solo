import { v4 as uuid } from 'uuid';
import {
  Magazine,
  Page,
  TextElement,
  ImageElement,
  ShapeElement,
  Element as TElement,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './types';

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportMagazineJSON(magazine: Magazine) {
  const json = JSON.stringify(magazine, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const safeName = (magazine.name || 'magazine').replace(/[^\w\u4e00-\u9fa5-]/g, '_');
  triggerDownload(blob, `${safeName}.magazine.json`);
}

export function validateMagazine(data: unknown): data is Magazine {
  if (!data || typeof data !== 'object') return false;
  const m = data as Record<string, unknown>;
  if (typeof m.id !== 'string') return false;
  if (typeof m.name !== 'string') return false;
  if (typeof m.author !== 'string') return false;
  if (!Array.isArray(m.pages)) return false;
  if (m.coverPageId !== null && typeof m.coverPageId !== 'string') return false;
  return (m.pages as unknown[]).every((p) => {
    if (!p || typeof p !== 'object') return false;
    const pg = p as Record<string, unknown>;
    if (typeof pg.id !== 'string') return false;
    if (typeof pg.order !== 'number') return false;
    if (!Array.isArray(pg.elements)) return false;
    return true;
  });
}

export function importMagazineFromFile(file: File): Promise<Magazine> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!validateMagazine(data)) {
          reject(new Error('JSON 格式不符合杂志规范'));
          return;
        }
        const normalized: Magazine = {
          ...data,
          id: data.id || uuid(),
          pages: (data.pages as Page[]).map((p) => ({
            ...p,
            id: p.id || uuid(),
            elements: (p.elements as TElement[]).map((e) => ({
              ...e,
              id: (e as { id?: string }).id || uuid(),
            })) as TElement[],
          })),
        };
        resolve(normalized);
      } catch (e) {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.readAsText(file);
  });
}

const THUMB_W = 400;
const THUMB_H = 566;

export async function generateCoverThumbnail(
  magazine: Magazine,
): Promise<Blob> {
  const scale = THUMB_W / CANVAS_WIDTH;
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;

  const sorted = [...magazine.pages].sort((a, b) => a.order - b.order);
  const cover =
    sorted.find((p) => p.id === magazine.coverPageId) ?? sorted[0];

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);

  const drawElements = [...cover.elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of drawElements) {
    ctx.save();
    const cx = (el.x + el.width / 2) * scale;
    const cy = (el.y + el.height / 2) * scale;
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    const w = el.width * scale;
    const h = el.height * scale;
    ctx.translate(-w / 2, -h / 2);

    if (el.type === 'shape') {
      const shape = el as ShapeElement;
      ctx.fillStyle = shape.fillColor;
      const r = Math.min(shape.borderRadius * scale, w / 2, h / 2);
      roundRectPath(ctx, 0, 0, w, h, r);
      ctx.fill();
    } else if (el.type === 'text') {
      const text = el as TextElement;
      ctx.fillStyle = text.color;
      ctx.font = `700 ${text.fontSize * scale}px "${text.fontFamily}", serif`;
      ctx.textBaseline = 'top';
      wrapText(ctx, text.content, 4, 4, w - 8, text.fontSize * scale * 1.3);
    } else if (el.type === 'image') {
      const img = el as ImageElement;
      try {
        const image = await loadImage(img.src);
        const iw = image.naturalWidth;
        const ih = image.naturalHeight;
        const ratio =
          img.fitMode === 'cover'
            ? Math.max(w / iw, h / ih)
            : Math.min(w / iw, h / ih);
        const dw = iw * ratio;
        const dh = ih * ratio;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.save();
        roundRectPath(ctx, 0, 0, w, h, 0);
        ctx.clip();
        ctx.drawImage(image, dx, dy, dw, dh);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, w, h);
      }
    }
    ctx.restore();
  }

  if (cover.id === magazine.coverPageId && magazine.name) {
    const gradient = ctx.createLinearGradient(0, 0, 0, THUMB_H * 0.45);
    gradient.addColorStop(0, 'rgba(26,37,47,0.85)');
    gradient.addColorStop(1, 'rgba(26,37,47,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, THUMB_W, THUMB_H * 0.45);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${36}px "Noto Serif SC", serif`;
    ctx.fillText(truncate(magazine.name, 14), THUMB_W / 2, 36);
    if (magazine.author) {
      ctx.font = `400 ${18}px "Noto Serif SC", serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(`— ${truncate(magazine.author, 12)} —`, THUMB_W / 2, 88);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('生成缩略图失败'));
    }, 'image/png');
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load fail'));
    img.src = src;
  });
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let line = '';
  let offsetY = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const testLine = line + ch;
    if (ch === '\n' || ctx.measureText(testLine).width > maxWidth) {
      ctx.fillText(line, x, y + offsetY);
      line = ch === '\n' ? '' : ch;
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y + offsetY);
}
