import type { PathPoint, Keyframe } from '@/types';

export interface DrawOptions {
  lineColor: string;
  lineWidth: number;
  eraserWidth: number;
  eraserColor: string;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number = 20,
  lineColor: string = '#D0D0D0',
  lineWidth: number = 0.5
): void {
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  options: DrawOptions
): void {
  if (points.length < 2) return;

  let currentPath: PathPoint[] = [];
  let currentIsEraser = points[0].isEraser;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    if (point.isEraser !== currentIsEraser) {
      drawPathSegment(ctx, currentPath, options, currentIsEraser);
      currentPath = [];
      currentIsEraser = point.isEraser;
    }

    currentPath.push(point);
  }

  if (currentPath.length > 0) {
    drawPathSegment(ctx, currentPath, options, currentIsEraser);
  }
}

function drawPathSegment(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  options: DrawOptions,
  isEraser: boolean
): void {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.strokeStyle = isEraser ? options.eraserColor : options.lineColor;
  ctx.lineWidth = isEraser ? options.eraserWidth : options.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function drawTrail(
  ctx: CanvasRenderingContext2D,
  trailPoints: PathPoint[],
  color: string,
  trailLength: number = 40
): void {
  if (trailPoints.length < 2) return;

  const visiblePoints = trailPoints.slice(-trailLength);
  const step = 1 / visiblePoints.length;

  for (let i = 1; i < visiblePoints.length; i++) {
    const alpha = i * step;
    const rgb = hexToRgb(color);
    if (!rgb) continue;

    ctx.beginPath();
    ctx.moveTo(visiblePoints[i - 1].x, visiblePoints[i - 1].y);
    ctx.lineTo(visiblePoints[i].x, visiblePoints[i].y);
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function drawKeyframes(
  ctx: CanvasRenderingContext2D,
  keyframes: Keyframe[],
  radius: number = 8,
  color: string = '#FF0000'
): void {
  keyframes.forEach(kf => {
    ctx.beginPath();
    ctx.arc(kf.x, kf.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(kf.index + 1), kf.x, kf.y);
  });
}

export function drawBezierPath(
  ctx: CanvasRenderingContext2D,
  bezierPath: { x: number; y: number }[],
  color: string = 'rgba(255, 0, 0, 0.3)',
  lineWidth: number = 2
): void {
  if (bezierPath.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(bezierPath[0].x, bezierPath[0].y);

  for (let i = 1; i < bezierPath.length; i++) {
    ctx.lineTo(bezierPath[i].x, bezierPath[i].y);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgColor: string = '#F0F0F0'
): void {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
}

export function exportToPNG(canvas: HTMLCanvasElement, filename: string = 'character-preview.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function getCanvasCoords(
  e: React.MouseEvent<HTMLCanvasElement> | MouseEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}
