import { Shape, PenShape, RectangleShape, CircleShape, StickyNote, ViewTransform } from '../store';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  viewTransform: ViewTransform;
  canvasWidth: number;
  canvasHeight: number;
}

export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, scale: number): void {
  const gridSize = 20;
  const scaledGridSize = gridSize * scale;

  ctx.save();
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1 / scale;
  ctx.globalAlpha = 0.5;

  for (let x = 0; x <= width; x += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPenShape(ctx: CanvasRenderingContext2D, shape: PenShape): void {
  if (shape.points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(shape.points[0].x, shape.points[0].y);

  for (let i = 1; i < shape.points.length; i++) {
    ctx.lineTo(shape.points[i].x, shape.points[i].y);
  }

  ctx.stroke();
  ctx.restore();
}

export function drawRectangleShape(ctx: CanvasRenderingContext2D, shape: RectangleShape): void {
  ctx.save();
  ctx.fillStyle = shape.color;
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;

  const x = shape.x;
  const y = shape.y;
  const w = shape.width;
  const h = shape.height;

  const left = w >= 0 ? x : x + w;
  const top = h >= 0 ? y : y + h;
  const width = Math.abs(w);
  const height = Math.abs(h);

  ctx.fillRect(left, top, width, height);
  ctx.restore();
}

export function drawCircleShape(ctx: CanvasRenderingContext2D, shape: CircleShape): void {
  ctx.save();
  ctx.fillStyle = shape.color;
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;

  ctx.beginPath();
  ctx.arc(shape.x, shape.y, Math.abs(shape.radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawStickyNote(ctx: CanvasRenderingContext2D, shape: StickyNote, isSelected: boolean): void {
  ctx.save();

  const x = shape.x;
  const y = shape.y;
  const w = shape.width;
  const h = shape.height;
  const radius = 8;

  ctx.fillStyle = shape.bgColor;
  ctx.strokeStyle = '#F0E68C';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  if (isSelected) {
    ctx.strokeStyle = '#3498DB';
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
  }

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  ctx.restore();

  if (shape.text) {
    ctx.save();
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'top';

    const padding = 10;
    const maxWidth = w - padding * 2;
    const lineHeight = 16;
    const maxLines = Math.floor((h - padding * 2) / lineHeight);

    const words = shape.text.split('');
    let line = '';
    let lines: string[] = [];
    let yPos = y + padding;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    if (line) {
      lines.push(line);
    }

    lines = lines.slice(0, maxLines);

    lines.forEach((l, i) => {
      ctx.fillText(l, x + padding, yPos + i * lineHeight);
    });

    ctx.restore();
  }
}

export function renderShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], selectedShapeId: string | null, viewTransform: ViewTransform): void {
  ctx.save();
  ctx.translate(viewTransform.offsetX, viewTransform.offsetY);
  ctx.scale(viewTransform.scale, viewTransform.scale);

  shapes.forEach((shape) => {
    switch (shape.type) {
      case 'pen':
        drawPenShape(ctx, shape);
        break;
      case 'rectangle':
        drawRectangleShape(ctx, shape);
        break;
      case 'circle':
        drawCircleShape(ctx, shape);
        break;
      case 'sticky':
        drawStickyNote(ctx, shape, shape.id === selectedShapeId);
        break;
    }
  });

  ctx.restore();
}

export function screenToCanvas(screenX: number, screenY: number, viewTransform: ViewTransform): { x: number; y: number } {
  return {
    x: (screenX - viewTransform.offsetX) / viewTransform.scale,
    y: (screenY - viewTransform.offsetY) / viewTransform.scale,
  };
}

export function canvasToScreen(canvasX: number, canvasY: number, viewTransform: ViewTransform): { x: number; y: number } {
  return {
    x: canvasX * viewTransform.scale + viewTransform.offsetX,
    y: canvasY * viewTransform.scale + viewTransform.offsetY,
  };
}
