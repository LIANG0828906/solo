import type { Stroke, Viewport, Point } from '@/types';
import { CANVAS_SIZE, THUMBNAIL_SIZE } from '@/types';

export function initializeCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  canvas.width = CANVAS_SIZE.width;
  canvas.height = CANVAS_SIZE.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2d context');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return ctx;
}

export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

function applyViewport(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
  ctx.save();
  ctx.translate(-viewport.offsetX, -viewport.offsetY);
}

function restoreViewport(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  viewport: Viewport,
): void {
  if (stroke.points.length < 1) return;

  applyViewport(ctx, viewport);

  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.globalCompositeOperation = stroke.blendMode as GlobalCompositeOperation;

  if (stroke.points.length === 1) {
    const p = stroke.points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  restoreViewport(ctx);
}

export function redrawAll(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  viewport: Viewport,
): void {
  clearCanvas(ctx);
  for (const stroke of strokes) {
    drawStroke(ctx, stroke, viewport);
  }
}

export function drawStrokeSegment(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  viewport: Viewport,
  fromIndex: number,
): void {
  if (fromIndex >= stroke.points.length) return;

  applyViewport(ctx, viewport);

  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.globalCompositeOperation = stroke.blendMode as GlobalCompositeOperation;

  const points = stroke.points.slice(Math.max(0, fromIndex - 1));
  if (points.length < 2) {
    if (points.length === 1 && fromIndex === 0) {
      const p = points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
    }
    restoreViewport(ctx);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  restoreViewport(ctx);
}

export function screenToCanvas(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  viewport: Viewport,
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX + viewport.offsetX,
    y: (clientY - rect.top) * scaleY + viewport.offsetY,
  };
}

export function generateThumbnail(sourceCanvas: HTMLCanvasElement): string {
  const thumb = document.createElement('canvas');
  thumb.width = THUMBNAIL_SIZE.width;
  thumb.height = THUMBNAIL_SIZE.height;
  const ctx = thumb.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, thumb.width, thumb.height);
  ctx.drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
    0,
    0,
    thumb.width,
    thumb.height,
  );

  return thumb.toDataURL('image/png');
}
