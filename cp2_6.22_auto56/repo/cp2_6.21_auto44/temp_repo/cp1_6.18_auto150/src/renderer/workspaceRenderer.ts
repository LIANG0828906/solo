import { GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import type { PlacedPart, PartTemplate } from '../types';
import { getTemplateById } from '../data/partData';
import { snapToGrid } from '../engine/assemblyEngine';

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  gridSize = GRID_SIZE
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(180, 170, 150, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += gridSize) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

interface RenderPartOptions {
  opacity?: number;
  overrideHighlight?: boolean;
  overrideColor?: string;
  showName?: boolean;
  bounceOffset?: number;
}

function drawPartShape(
  ctx: CanvasRenderingContext2D,
  template: PartTemplate,
  x: number,
  y: number
): void {
  const { width, height, id } = template;
  if (id.includes('triangle')) {
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
  } else if (id.includes('circle') && !id.includes('ring')) {
    const r = Math.min(width, height) / 2;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, r, 0, Math.PI * 2);
  } else if (id.includes('ring')) {
    const rOuter = Math.min(width, height) / 2;
    const rInner = rOuter * 0.55;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, rOuter, 0, Math.PI * 2);
    ctx.moveTo(x + width / 2 + rInner, y + height / 2);
    ctx.arc(x + width / 2, y + height / 2, rInner, 0, Math.PI * 2, true);
  } else {
    const r = 6;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export function renderPart(
  ctx: CanvasRenderingContext2D,
  part: PlacedPart,
  options: RenderPartOptions = {}
): void {
  const template = getTemplateById(part.templateId);
  if (!template) return;

  const opacity = options.opacity ?? 1;
  const highlighted = options.overrideHighlight ?? part.isHighlighted;
  const color = options.overrideColor ?? template.color;
  const bounce = options.bounceOffset ?? 0;

  ctx.save();
  ctx.globalAlpha = opacity;

  const drawX = part.x;
  const drawY = part.y - bounce;

  drawPartShape(ctx, template, drawX, drawY);

  ctx.fillStyle = color;
  ctx.fill('evenodd');

  if (template.material === 'metal') {
    const gradient = ctx.createLinearGradient(
      drawX,
      drawY,
      drawX + template.width,
      drawY + template.height
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = gradient;
    ctx.fill('evenodd');
  } else if (template.material === 'fabric') {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < template.width + template.height; i += 8) {
      ctx.beginPath();
      ctx.moveTo(drawX + i, drawY);
      ctx.lineTo(drawX, drawY + i);
      ctx.stroke();
    }
    ctx.restore();
  } else if (template.material === 'wood') {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = 8; i < template.height; i += 10) {
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + i);
      ctx.bezierCurveTo(
        drawX + template.width * 0.3,
        drawY + i - 2,
        drawX + template.width * 0.7,
        drawY + i + 2,
        drawX + template.width,
        drawY + i
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  if (highlighted) {
    drawPartShape(ctx, template, drawX, drawY);
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    drawPartShape(ctx, template, drawX, drawY);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

export function renderDragPreview(
  ctx: CanvasRenderingContext2D,
  template: PartTemplate,
  mouseX: number,
  mouseY: number
): void {
  const snappedX = snapToGrid(mouseX - template.width / 2);
  const snappedY = snapToGrid(mouseY - template.height / 2);

  ctx.save();
  ctx.globalAlpha = 0.5;

  const fakePart: PlacedPart = {
    instanceId: 'preview',
    templateId: template.id,
    x: snappedX,
    y: snappedY,
    rotation: 0,
    isHighlighted: false,
  };
  renderPart(ctx, fakePart);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(212, 163, 115, 0.8)';
  ctx.beginPath();
  ctx.arc(snappedX + template.width / 2, snappedY + template.height / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderAll(
  ctx: CanvasRenderingContext2D,
  parts: PlacedPart[],
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#FAFAF0';
  ctx.fillRect(0, 0, width, height);
  renderGrid(ctx, width, height);

  for (const part of parts) {
    renderPart(ctx, part);
  }
}

export function exportToPNG(
  canvas: HTMLCanvasElement,
  scale = 2
): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = canvas.width * scale;
  offscreen.height = canvas.height * scale;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return '';
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = canvas.width;
  tmpCanvas.height = canvas.height;
  const tmpCtx = tmpCanvas.getContext('2d');
  if (tmpCtx) {
    tmpCtx.clearRect(0, 0, canvas.width, canvas.height);
    const sourceCtx = canvas.getContext('2d');
    if (sourceCtx) {
      const imgData = sourceCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (
          Math.abs(r - 250) < 8 &&
          Math.abs(g - 250) < 8 &&
          Math.abs(b - 240) < 16
        ) {
          data[i + 3] = 0;
        }
      }
      tmpCtx.putImageData(imgData, 0, 0);
    }
  }
  ctx.drawImage(tmpCanvas, 0, 0);
  return offscreen.toDataURL('image/png');
}

export function renderBlinkingPart(
  ctx: CanvasRenderingContext2D,
  part: PlacedPart,
  intensity: number
): void {
  const template = getTemplateById(part.templateId);
  if (!template) return;
  ctx.save();
  drawPartShape(ctx, template, part.x, part.y);
  const alpha = Math.min(1, intensity);
  ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
  ctx.fill();
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}
