import type { Shape, Point } from '../types';

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save();
  switch (shape.type) {
    case 'brush':
      drawBrush(ctx, shape);
      break;
    case 'rectangle':
      drawRectangle(ctx, shape);
      break;
    case 'circle':
      drawCircle(ctx, shape);
      break;
    case 'line':
      drawLine(ctx, shape);
      break;
    case 'eraser':
      drawEraser(ctx, shape);
      break;
    case 'note':
      drawNote(ctx, shape);
      break;
  }
  ctx.restore();
}

function drawBrush(ctx: CanvasRenderingContext2D, shape: any) {
  if (shape.points.length < 2) return;
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(shape.points[0].x, shape.points[0].y);
  for (let i = 1; i < shape.points.length; i++) {
    ctx.lineTo(shape.points[i].x, shape.points[i].y);
  }
  ctx.stroke();
}

function drawRectangle(ctx: CanvasRenderingContext2D, shape: any) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.lineWidth;
  if (shape.fillColor && shape.fillColor !== 'transparent') {
    ctx.fillStyle = shape.fillColor;
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
  }
  ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
}

function drawCircle(ctx: CanvasRenderingContext2D, shape: any) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.lineWidth;
  ctx.beginPath();
  ctx.arc(shape.x, shape.y, Math.abs(shape.radius), 0, Math.PI * 2);
  if (shape.fillColor && shape.fillColor !== 'transparent') {
    ctx.fillStyle = shape.fillColor;
    ctx.fill();
  }
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, shape: any) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shape.x1, shape.y1);
  ctx.lineTo(shape.x2, shape.y2);
  ctx.stroke();
}

function drawEraser(ctx: CanvasRenderingContext2D, shape: any) {
  if (shape.points.length < 2) return;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = shape.lineWidth * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(shape.points[0].x, shape.points[0].y);
  for (let i = 1; i < shape.points.length; i++) {
    ctx.lineTo(shape.points[i].x, shape.points[i].y);
  }
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

function drawNote(ctx: CanvasRenderingContext2D, shape: any) {
  const { x, y, width, height, text } = shape;
  ctx.fillStyle = '#FFF9C4';
  ctx.strokeStyle = '#E0D890';
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  const radius = 8;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();
  
  ctx.fillStyle = '#333333';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textBaseline = 'top';
  
  const padding = 12;
  const textX = x + padding;
  const textY = y + padding;
  const maxWidth = width - padding * 2;
  const lineHeight = 18;
  
  const lines = wrapText(ctx, text, maxWidth);
  let currentY = textY;
  for (const line of lines) {
    if (currentY + lineHeight > y + height - padding) {
      ctx.fillText('...', textX, currentY);
      break;
    }
    ctx.fillText(line, textX, currentY);
    currentY += lineHeight;
  }
  
  ctx.fillStyle = '#E53935';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('×', x + width - 10, y + 6);
  ctx.textAlign = 'left';
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  
  for (const paragraph of paragraphs) {
    let currentLine = '';
    for (const char of paragraph) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }
  
  return lines;
}

export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, offsetX: number, offsetY: number, scale: number) {
  const gridSize = 40 * scale;
  const startX = -(offsetX % gridSize);
  const startY = -(offsetY % gridSize);
  
  ctx.save();
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  
  for (let x = startX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = startY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  ctx.restore();
}

export function screenToCanvas(screenX: number, screenY: number, offsetX: number, offsetY: number, scale: number): Point {
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  };
}

export function isPointInNote(px: number, py: number, note: any): boolean {
  return px >= note.x && px <= note.x + note.width && py >= note.y && py <= note.y + note.height;
}

export function isPointOnNoteDeleteButton(px: number, py: number, note: any): boolean {
  const btnSize = 24;
  return px >= note.x + note.width - btnSize && px <= note.x + note.width && py >= note.y && py <= note.y + btnSize;
}
