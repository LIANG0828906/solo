import type { Rect } from '@/types';

export function mergeRects(rects: Rect[]): Rect[] {
  if (rects.length === 0) return [];
  if (rects.length === 1) return [rects[0]];

  const sorted = [...rects].sort((a, b) => a.x - b.x);
  const merged: Rect[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (
      next.x <= current.x + current.w + 4 &&
      next.y <= current.y + current.h + 4 &&
      next.y + next.h >= current.y - 4
    ) {
      current.x = Math.min(current.x, next.x);
      current.y = Math.min(current.y, next.y);
      current.w = Math.max(current.x + current.w, next.x + next.w) - current.x;
      current.h = Math.max(current.y + current.h, next.y + next.h) - current.y;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

export function inflateRect(rect: Rect, margin: number): Rect {
  return {
    x: rect.x - margin,
    y: rect.y - margin,
    w: rect.w + margin * 2,
    h: rect.h + margin * 2,
  };
}

export function rectIntersect(a: Rect, b: Rect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawNoiseTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseColor: string,
  noiseIntensity = 0.1
): void {
  ctx.save();
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);

  const pixelSize = 4;
  for (let py = y; py < y + h; py += pixelSize) {
    for (let px = x; px < x + w; px += pixelSize) {
      const noise = (Math.random() - 0.5) * 2 * noiseIntensity;
      const r = 212 + Math.round(noise * 255);
      const g = 163 + Math.round(noise * 200);
      const b = 115 + Math.round(noise * 150);
      ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
      ctx.fillRect(px, py, pixelSize, pixelSize);
    }
  }
  ctx.restore();
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): void {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}
