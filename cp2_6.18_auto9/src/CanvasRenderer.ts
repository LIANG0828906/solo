import { CanvasElement, ViewportState, StrokeElement, StickyElement, RectangleElement } from './CanvasEngine';

const BASE_GRID_SPACING = 40;
const MIN_GRID_SPACING = 10;
const MAX_GRID_SPACING = 160;
const BASE_LINE_ALPHA = 0.9;
const CENTER_BRIGHTNESS_BOOST = 0.12;

function getGridParams(zoom: number) {
  let spacing = BASE_GRID_SPACING / zoom;

  const preferredSpacings = [10, 20, 40, 80, 160, 320];
  let bestSpacing = BASE_GRID_SPACING;
  let bestDiff = Infinity;
  for (const ps of preferredSpacings) {
    const diff = Math.abs(ps - spacing);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSpacing = ps;
    }
  }
  spacing = bestSpacing;
  spacing = Math.max(MIN_GRID_SPACING, Math.min(MAX_GRID_SPACING, spacing));

  const ratio = spacing / BASE_GRID_SPACING;
  let alpha = BASE_LINE_ALPHA / Math.sqrt(ratio);
  alpha = Math.max(0.3, Math.min(1.0, alpha));

  if (zoom < 0.6) alpha *= 1.1;
  if (zoom > 2.0) alpha *= 0.85;
  alpha = Math.max(0.25, Math.min(1.0, alpha));

  return { spacing, alpha };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 232, g: 232, b: 232 };
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number,
  gridColor: string = '#E8E8E8'
): void {
  const { offsetX, offsetY, zoom } = viewport;
  const { spacing, alpha } = getGridParams(zoom);

  const rgb = hexToRgb(gridColor);

  const viewportCenterX = canvasWidth / 2;
  const viewportCenterY = canvasHeight / 2;
  const maxDistance = Math.hypot(canvasWidth / 2, canvasHeight / 2);

  const worldStartX = -offsetX / zoom;
  const worldStartY = -offsetY / zoom;
  const worldEndX = worldStartX + canvasWidth / zoom;
  const worldEndY = worldStartY + canvasHeight / zoom;

  const startX = Math.floor(worldStartX / spacing) * spacing;
  const startY = Math.floor(worldStartY / spacing) * spacing;

  ctx.lineWidth = 1;

  for (let wx = startX; wx <= worldEndX + spacing; wx += spacing) {
    const screenX = wx * zoom + offsetX;

    ctx.beginPath();
    const segments = 16;
    for (let seg = 0; seg <= segments; seg++) {
      const screenY = (seg / segments) * canvasHeight;
      const worldY = (screenY - offsetY) / zoom;

      const distFromCenter = Math.hypot(screenX - viewportCenterX, screenY - viewportCenterY);
      const distFactor = Math.min(1, distFromCenter / maxDistance);
      const centerBoost = (1 - distFactor) * CENTER_BRIGHTNESS_BOOST;
      const lineAlpha = Math.min(1.0, alpha * (0.85 + centerBoost));

      const currentR = rgb.r;
      const currentG = rgb.g;
      const currentB = rgb.b;

      ctx.strokeStyle = `rgba(${currentR},${currentG},${currentB},${lineAlpha})`;

      if (seg === 0) {
        ctx.moveTo(screenX, screenY);
      } else {
        const prevSeg = seg - 1;
        const prevY = (prevSeg / segments) * canvasHeight;
        const prevDist = Math.hypot(screenX - viewportCenterX, prevY - viewportCenterY);
        const prevFactor = Math.min(1, prevDist / maxDistance);
        const prevBoost = (1 - prevFactor) * CENTER_BRIGHTNESS_BOOST;
        const prevAlpha = Math.min(1.0, alpha * (0.85 + prevBoost));

        const midY = (prevY + screenY) / 2;
        const midAlpha = (prevAlpha + lineAlpha) / 2;
        const midR = rgb.r;
        const midG = rgb.g;
        const midB = rgb.b;

        ctx.strokeStyle = `rgba(${midR},${midG},${midB},${midAlpha})`;
        ctx.lineTo(screenX, midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX, midY);
        ctx.strokeStyle = `rgba(${currentR},${currentG},${currentB},${lineAlpha})`;
        ctx.lineTo(screenX, screenY);
      }
    }
    ctx.stroke();
  }

  for (let wy = startY; wy <= worldEndY + spacing; wy += spacing) {
    const screenY = wy * zoom + offsetY;

    ctx.beginPath();
    const segments = 16;
    for (let seg = 0; seg <= segments; seg++) {
      const screenX = (seg / segments) * canvasWidth;

      const distFromCenter = Math.hypot(screenX - viewportCenterX, screenY - viewportCenterY);
      const distFactor = Math.min(1, distFromCenter / maxDistance);
      const centerBoost = (1 - distFactor) * CENTER_BRIGHTNESS_BOOST;
      const lineAlpha = Math.min(1.0, alpha * (0.85 + centerBoost));

      const currentR = rgb.r;
      const currentG = rgb.g;
      const currentB = rgb.b;

      ctx.strokeStyle = `rgba(${currentR},${currentG},${currentB},${lineAlpha})`;

      if (seg === 0) {
        ctx.moveTo(screenX, screenY);
      } else {
        const prevSeg = seg - 1;
        const prevX = (prevSeg / segments) * canvasWidth;
        const prevDist = Math.hypot(prevX - viewportCenterX, screenY - viewportCenterY);
        const prevFactor = Math.min(1, prevDist / maxDistance);
        const prevBoost = (1 - prevFactor) * CENTER_BRIGHTNESS_BOOST;
        const prevAlpha = Math.min(1.0, alpha * (0.85 + prevBoost));

        const midX = (prevX + screenX) / 2;
        const midAlpha = (prevAlpha + lineAlpha) / 2;
        const midR = rgb.r;
        const midG = rgb.g;
        const midB = rgb.b;

        ctx.strokeStyle = `rgba(${midR},${midG},${midB},${midAlpha})`;
        ctx.lineTo(midX, screenY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midX, screenY);
        ctx.strokeStyle = `rgba(${currentR},${currentG},${currentB},${lineAlpha})`;
        ctx.lineTo(screenX, screenY);
      }
    }
    ctx.stroke();
  }
}

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): void {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const maxRadius = Math.hypot(centerX, centerY);

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.02)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeElement,
  viewport: ViewportState,
  isSelected: boolean
): void {
  if (stroke.points.length === 0) return;

  const { zoom, offsetX, offsetY } = viewport;

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth * zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  for (let i = 0; i < stroke.points.length; i++) {
    const sx = stroke.points[i].x * zoom + offsetX;
    const sy = stroke.points[i].y * zoom + offsetY;
    if (i === 0) {
      ctx.moveTo(sx, sy);
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();
  ctx.restore();

  if (isSelected && stroke.points.length > 0) {
    drawSelectionBoxForStroke(ctx, stroke, viewport);
  }
}

function drawSelectionBoxForStroke(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeElement,
  viewport: ViewportState
): void {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of stroke.points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const padding = 6;
  drawSelectionBox(ctx, minX - padding, minY - padding, maxX - minX + padding * 2, maxY - minY + padding * 2, viewport);
}

export function drawSticky(
  ctx: CanvasRenderingContext2D,
  sticky: StickyElement,
  viewport: ViewportState,
  isSelected: boolean
): void {
  const { zoom, offsetX, offsetY } = viewport;
  const x = sticky.x * zoom + offsetX;
  const y = sticky.y * zoom + offsetY;
  const w = sticky.width * zoom;
  const h = sticky.height * zoom;
  const radius = 8 * zoom;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 8 * zoom;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2 * zoom;

  ctx.fillStyle = sticky.bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.restore();

  if (isSelected) {
    drawSelectionBox(ctx, sticky.x, sticky.y, sticky.width, sticky.height, viewport);
  }
}

export function drawStickyText(
  ctx: CanvasRenderingContext2D,
  sticky: StickyElement,
  viewport: ViewportState
): void {
  const { zoom, offsetX, offsetY } = viewport;
  const x = sticky.x * zoom + offsetX;
  const y = sticky.y * zoom + offsetY;
  const w = sticky.width * zoom;
  const padding = 16 * zoom;
  const fontSize = 14 * zoom;
  const lineHeight = fontSize * 1.5;

  ctx.save();
  ctx.fillStyle = '#2C2C3A';
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  const lines = parseMarkdownAndWrap(sticky.content, ctx, w - padding * 2);
  let textY = y + padding + fontSize;

  for (const line of lines) {
    let textX = x + padding;
    for (const segment of line) {
      ctx.save();
      ctx.font = `${segment.bold ? 'bold ' : ''}${segment.italic ? 'italic ' : ''}${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = segment.color;
      ctx.fillText(segment.text, textX, textY);
      textX += ctx.measureText(segment.text).width;
      ctx.restore();
    }
    textY += lineHeight;
    if (textY > y + h - padding) break;
  }
  ctx.restore();
}

interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  color: string;
}

function parseMarkdownAndWrap(text: string, ctx: CanvasRenderingContext2D, maxWidth: number): TextSegment[][] {
  const segments: TextSegment[] = parseMarkdown(text);
  const lines: TextSegment[][] = [];
  let currentLine: TextSegment[] = [];
  let currentWidth = 0;

  for (const seg of segments) {
    ctx.save();
    ctx.font = `${seg.bold ? 'bold ' : ''}${seg.italic ? 'italic ' : ''}${14}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

    const words = seg.text.split(/(\s+)/);
    for (const word of words) {
      const wordWidth = ctx.measureText(word).width;

      if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      }

      currentLine.push({ text: word, bold: seg.bold, italic: seg.italic, color: seg.color });
      currentWidth += wordWidth;
    }
    ctx.restore();
  }

  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
}

function parseMarkdown(text: string): TextSegment[] {
  const result: TextSegment[] = [];
  let i = 0;
  let currentBold = false;
  let currentItalic = false;

  while (i < text.length) {
    let matched = false;

    if (text[i] === '*' && i + 2 < text.length && text[i + 1] === '*' && text[i + 2] === '*') {
      const endIdx = findMarkerEnd(text, i + 3, '***');
      if (endIdx !== -1) {
        result.push({
          text: text.substring(i + 3, endIdx),
          bold: true,
          italic: true,
          color: '#2C2C3A'
        });
        i = endIdx + 3;
        matched = true;
      }
    }

    if (!matched && text[i] === '*' && i + 1 < text.length && text[i + 1] === '*') {
      const endIdx = findMarkerEnd(text, i + 2, '**');
      if (endIdx !== -1) {
        result.push({
          text: text.substring(i + 2, endIdx),
          bold: true,
          italic: currentItalic,
          color: '#2C2C3A'
        });
        currentBold = currentBold;
        i = endIdx + 2;
        matched = true;
      }
    }

    if (!matched && text[i] === '*') {
      const endIdx = findMarkerEnd(text, i + 1, '*');
      if (endIdx !== -1) {
        result.push({
          text: text.substring(i + 1, endIdx),
          bold: currentBold,
          italic: true,
          color: '#2C2C3A'
        });
        i = endIdx + 1;
        matched = true;
      }
    }

    if (!matched) {
      let end = i;
      while (end < text.length && text[end] !== '*') end++;
      if (end > i) {
        result.push({
          text: text.substring(i, end),
          bold: currentBold,
          italic: currentItalic,
          color: '#2C2C3A'
        });
      }
      i = end;
    }
  }

  if (result.length === 0) {
    result.push({ text: '', bold: false, italic: false, color: '#2C2C3A' });
  }
  return result;
}

function findMarkerEnd(text: string, startIdx: number, marker: string): number {
  let i = startIdx;
  while (i < text.length) {
    if (text.substring(i, i + marker.length) === marker) {
      return i;
    }
    i++;
  }
  return -1;
}

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  rect: RectangleElement,
  viewport: ViewportState,
  isSelected: boolean
): void {
  const { zoom, offsetX, offsetY } = viewport;
  const x = rect.x * zoom + offsetX;
  const y = rect.y * zoom + offsetY;
  const w = rect.width * zoom;
  const h = rect.height * zoom;

  ctx.save();
  if (rect.fillColor && rect.fillColor !== 'transparent') {
    ctx.fillStyle = rect.fillColor;
    ctx.fillRect(x, y, w, h);
  }

  ctx.strokeStyle = rect.borderColor;
  ctx.lineWidth = rect.borderWidth * zoom;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();

  if (isSelected) {
    drawSelectionBox(ctx, rect.x, rect.y, rect.width, rect.height, viewport);
  }
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  worldW: number,
  worldH: number,
  viewport: ViewportState
): void {
  const { zoom, offsetX, offsetY } = viewport;
  const x = worldX * zoom + offsetX;
  const y = worldY * zoom + offsetY;
  const w = worldW * zoom;
  const h = worldH * zoom;

  ctx.save();
  ctx.strokeStyle = '#4A90D9';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();
}

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  selectedId: string | null,
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  drawGrid(ctx, viewport, canvasWidth, canvasHeight, '#E8E8E8');

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of sorted) {
    const isSelected = el.id === selectedId;
    if (el.type === 'stroke') {
      drawStroke(ctx, el, viewport, isSelected);
    } else if (el.type === 'sticky') {
      drawSticky(ctx, el, viewport, isSelected);
    } else if (el.type === 'rectangle') {
      drawRectangle(ctx, el, viewport, isSelected);
    }
  }

  for (const el of sorted) {
    if (el.type === 'sticky') {
      drawStickyText(ctx, el, viewport);
    }
  }

  drawVignette(ctx, canvasWidth, canvasHeight);
}
