import { Point, DrawingPath, ToolType } from '../types';

export function drawPath(ctx: CanvasRenderingContext2D, path: DrawingPath): void {
  ctx.save();
  ctx.strokeStyle = path.color;
  ctx.lineWidth = path.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (path.type === 'pen') {
    drawSmoothLine(ctx, path.points);
  } else if (path.type === 'rectangle') {
    drawRectangle(ctx, path.points);
  } else if (path.type === 'circle') {
    drawCircle(ctx, path.points);
  }

  ctx.restore();
}

export function drawSmoothLine(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  if (points.length >= 2) {
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
}

export function drawRectangle(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[points.length - 1];
  const width = end.x - start.x;
  const height = end.y - start.y;

  ctx.beginPath();
  ctx.rect(start.x, start.y, width, height);
  ctx.stroke();
}

export function drawCircle(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[points.length - 1];
  const radiusX = Math.abs(end.x - start.x);
  const radiusY = Math.abs(end.y - start.y);
  const radius = Math.max(radiusX, radiusY);

  ctx.beginPath();
  ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawPreview(
  ctx: CanvasRenderingContext2D,
  tool: ToolType,
  points: Point[],
  color: string,
  lineWidth: number
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([5, 5]);

  if (tool === 'pen') {
    drawSmoothLine(ctx, points);
  } else if (tool === 'rectangle') {
    drawRectangle(ctx, points);
  } else if (tool === 'circle') {
    drawCircle(ctx, points);
  }

  ctx.restore();
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

export function redrawAll(
  ctx: CanvasRenderingContext2D,
  drawings: DrawingPath[],
  width: number,
  height: number
): void {
  clearCanvas(ctx, width, height);
  for (const path of drawings) {
    drawPath(ctx, path);
  }
}
