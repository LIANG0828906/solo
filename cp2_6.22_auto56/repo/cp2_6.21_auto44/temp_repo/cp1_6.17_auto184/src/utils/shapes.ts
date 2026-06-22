import { ShapeType } from '@/types';

export function drawShape(
  ctx: CanvasRenderingContext2D,
  type: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.fillStyle = color;

  switch (type) {
    case 'circle':
      drawCircle(ctx, size);
      break;
    case 'triangle':
      drawTriangle(ctx, size);
      break;
    case 'star':
      drawStar(ctx, size);
      break;
    case 'diamond':
      drawDiamond(ctx, size);
      break;
  }

  ctx.restore();
}

function drawCircle(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawTriangle(ctx: CanvasRenderingContext2D, size: number): void {
  const h = size * 0.866;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(-size / 2, h / 2);
  ctx.lineTo(size / 2, h / 2);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number): void {
  const outerRadius = size / 2;
  const innerRadius = size / 4;
  const spikes = 5;
  const step = Math.PI / spikes;

  ctx.beginPath();
  let rotation = -Math.PI / 2;

  ctx.moveTo(
    Math.cos(rotation) * outerRadius,
    Math.sin(rotation) * outerRadius
  );

  for (let i = 0; i < spikes; i++) {
    rotation += step;
    ctx.lineTo(
      Math.cos(rotation) * innerRadius,
      Math.sin(rotation) * innerRadius
    );
    rotation += step;
    ctx.lineTo(
      Math.cos(rotation) * outerRadius,
      Math.sin(rotation) * outerRadius
    );
  }

  ctx.closePath();
  ctx.fill();
}

function drawDiamond(ctx: CanvasRenderingContext2D, size: number): void {
  const half = size / 2;
  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(half / 1.5, 0);
  ctx.lineTo(0, half);
  ctx.lineTo(-half / 1.5, 0);
  ctx.closePath();
  ctx.fill();
}

export function drawShapeOutline(
  ctx: CanvasRenderingContext2D,
  type: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth: number = 2,
  rotation: number = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  switch (type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'triangle':
      const h = size * 0.866;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(-size / 2, h / 2);
      ctx.lineTo(size / 2, h / 2);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'star':
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      const spikes = 5;
      const step = Math.PI / spikes;
      let rot = -Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(rot) * outerRadius,
        Math.sin(rot) * outerRadius
      );

      for (let i = 0; i < spikes; i++) {
        rot += step;
        ctx.lineTo(
          Math.cos(rot) * innerRadius,
          Math.sin(rot) * innerRadius
        );
        rot += step;
        ctx.lineTo(
          Math.cos(rot) * outerRadius,
          Math.sin(rot) * outerRadius
        );
      }

      ctx.closePath();
      ctx.stroke();
      break;
    case 'diamond':
      const half = size / 2;
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(half / 1.5, 0);
      ctx.lineTo(0, half);
      ctx.lineTo(-half / 1.5, 0);
      ctx.closePath();
      ctx.stroke();
      break;
  }

  ctx.restore();
}

export function isPointInShape(
  type: ShapeType,
  px: number,
  py: number,
  shapeX: number,
  shapeY: number,
  size: number,
  rotation: number = 0
): boolean {
  const dx = px - shapeX;
  const dy = py - shapeY;
  const rad = (-rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;

  switch (type) {
    case 'circle':
      return Math.sqrt(rx * rx + ry * ry) <= size / 2;
    case 'triangle':
      return pointInTriangle(rx, ry, size);
    case 'star':
      return Math.sqrt(rx * rx + ry * ry) <= size / 2;
    case 'diamond':
      return pointInDiamond(rx, ry, size);
    default:
      return false;
  }
}

function pointInTriangle(px: number, py: number, size: number): boolean {
  const h = size * 0.866;
  const x1 = 0;
  const y1 = -h / 2;
  const x2 = -size / 2;
  const y2 = h / 2;
  const x3 = size / 2;
  const y3 = h / 2;

  const area = Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
  const area1 = Math.abs((px * (y2 - y3) + x2 * (y3 - py) + x3 * (py - y2)) / 2);
  const area2 = Math.abs((x1 * (py - y3) + px * (y3 - y1) + x3 * (y1 - py)) / 2);
  const area3 = Math.abs((x1 * (y2 - py) + x2 * (py - y1) + px * (y1 - y2)) / 2);

  return Math.abs(area - (area1 + area2 + area3)) < 0.1;
}

function pointInDiamond(px: number, py: number, size: number): boolean {
  const half = size / 2;
  const hw = half / 1.5;
  return (
    Math.abs(px) / hw + Math.abs(py) / half <= 1
  );
}
