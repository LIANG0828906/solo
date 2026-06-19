import { Point, DrawingPath, ToolType } from '../types';

function interpolatePoints(p1: Point, p2: Point, maxDistance: number = 3): Point[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= maxDistance) {
    return [p2];
  }

  const steps = Math.ceil(distance / maxDistance);
  const points: Point[] = [];

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: p1.x + dx * t,
      y: p1.y + dy * t,
    });
  }

  return points;
}

export function densifyPoints(points: Point[], maxDistance: number = 3): Point[] {
  if (points.length < 2) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const interpolated = interpolatePoints(result[result.length - 1], points[i], maxDistance);
    result.push(...interpolated);
  }

  return result;
}

export function drawPath(ctx: CanvasRenderingContext2D, path: DrawingPath): void {
  ctx.save();
  ctx.strokeStyle = path.color;
  ctx.lineWidth = path.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  if (path.type === 'pen') {
    const points = densifyPoints(path.points, 3);
    drawSmoothLine(ctx, points);
  } else if (path.type === 'rectangle') {
    drawRectangle(ctx, path.points);
  } else if (path.type === 'circle') {
    drawCircle(ctx, path.points);
  }

  ctx.restore();
}

export function drawSmoothLine(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) {
    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
    return;
  }

  const densePoints = densifyPoints(points, 3);

  ctx.beginPath();
  ctx.moveTo(densePoints[0].x, densePoints[0].y);

  if (densePoints.length === 2) {
    ctx.lineTo(densePoints[1].x, densePoints[1].y);
  } else {
    for (let i = 1; i < densePoints.length - 1; i++) {
      const xc = (densePoints[i].x + densePoints[i + 1].x) / 2;
      const yc = (densePoints[i].y + densePoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(densePoints[i].x, densePoints[i].y, xc, yc);
    }
    ctx.lineTo(densePoints[densePoints.length - 1].x, densePoints[densePoints.length - 1].y);
  }

  ctx.stroke();
}

export function drawSimpleLine(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length < 2) return;

  const densePoints = densifyPoints(points, 3);

  ctx.beginPath();
  ctx.moveTo(densePoints[0].x, densePoints[0].y);

  for (let i = 1; i < densePoints.length; i++) {
    ctx.lineTo(densePoints[i].x, densePoints[i].y);
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
  if (points.length < 2) {
    if (points.length === 1 && tool === 'pen') {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return;
  }

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
