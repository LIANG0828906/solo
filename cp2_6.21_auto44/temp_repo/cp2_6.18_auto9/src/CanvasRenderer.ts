import { CanvasElement, ViewportState, StrokeElement, StickyElement, RectangleElement } from './CanvasEngine';

const BASE_GRID_SPACING = 40;
const MIN_GRID_SPACING = 10;
const MAX_GRID_SPACING = 320;
const BASE_LINE_ALPHA = 0.75;

const PREFERRED_SPACINGS = [10, 20, 40, 80, 160, 320];

const GRID_LINE_THRESHOLD = 250;
const PERF_GRID_LINE_THRESHOLD = 400;

let lastFrameTime = 0;
let frameCount = 0;
let fps = 60;
let currentQuality: 'high' | 'medium' | 'low' = 'high';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getGridParams(zoom: number, quality: 'high' | 'medium' | 'low' = 'high') {
  const rawSpacing = BASE_GRID_SPACING / zoom;

  let lowerIdx = 0;
  let upperIdx = PREFERRED_SPACINGS.length - 1;
  for (let i = 0; i < PREFERRED_SPACINGS.length - 1; i++) {
    if (rawSpacing >= PREFERRED_SPACINGS[i] && rawSpacing <= PREFERRED_SPACINGS[i + 1]) {
      lowerIdx = i;
      upperIdx = i + 1;
      break;
    }
  }
  if (rawSpacing < PREFERRED_SPACINGS[0]) {
    lowerIdx = 0;
    upperIdx = 0;
  }
  if (rawSpacing > PREFERRED_SPACINGS[PREFERRED_SPACINGS.length - 1]) {
    lowerIdx = PREFERRED_SPACINGS.length - 1;
    upperIdx = PREFERRED_SPACINGS.length - 1;
  }

  const lower = PREFERRED_SPACINGS[lowerIdx];
  const upper = PREFERRED_SPACINGS[upperIdx];
  const range = upper - lower;

  let t = range > 0 ? (rawSpacing - lower) / range : 0;
  t = Math.max(0, Math.min(1, t));

  const softT = easeInOutCubic(t);
  const spacing = lerp(lower, upper, softT);

  const clampedSpacing = Math.max(MIN_GRID_SPACING, Math.min(MAX_GRID_SPACING, spacing));

  const ratio = clampedSpacing / BASE_GRID_SPACING;
  let alpha = BASE_LINE_ALPHA / Math.sqrt(ratio);
  alpha = Math.max(0.25, Math.min(0.9, alpha));

  if (zoom < 0.6) alpha *= 1.15;
  if (zoom > 2.0) alpha *= 0.8;
  alpha = Math.max(0.2, Math.min(0.95, alpha));

  if (quality === 'medium') alpha *= 0.85;
  if (quality === 'low') alpha *= 0.65;

  let displaySpacing = clampedSpacing;
  if (quality === 'medium') displaySpacing = clampedSpacing * 2;
  if (quality === 'low') displaySpacing = clampedSpacing * 4;
  displaySpacing = Math.min(MAX_GRID_SPACING, displaySpacing);

  return { spacing: displaySpacing, alpha, baseAlpha: alpha };
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

export function updateFpsMetric(): void {
  frameCount++;
  const now = performance.now();
  if (now - lastFrameTime >= 500) {
    fps = (frameCount * 1000) / (now - lastFrameTime);
    frameCount = 0;
    lastFrameTime = now;

    if (fps < 45 && currentQuality === 'high') {
      currentQuality = 'medium';
    } else if (fps < 30 && currentQuality === 'medium') {
      currentQuality = 'low';
    } else if (fps > 55 && currentQuality === 'medium') {
      currentQuality = 'high';
    } else if (fps > 40 && currentQuality === 'low') {
      currentQuality = 'medium';
    }
  }
}

export function getCurrentGridQuality(): 'high' | 'medium' | 'low' {
  return currentQuality;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number,
  gridColor: string = '#E8E8E8'
): void {
  const { offsetX, offsetY, zoom } = viewport;
  const quality = currentQuality;
  const { spacing, alpha } = getGridParams(zoom, quality);

  const rgb = hexToRgb(gridColor);

  const viewportCenterX = canvasWidth / 2;
  const viewportCenterY = canvasHeight / 2;
  const viewportMin = Math.min(canvasWidth, canvasHeight);
  const viewportMax = Math.max(canvasWidth, canvasHeight);

  const innerRadius = viewportMin * 0.2;
  const outerRadius = viewportMax * 0.75;

  const centerBoostMax = 0.08 + (viewportMin / 2000) * 0.06;
  const edgeDarken = 0.12 + (viewportMin / 3000) * 0.08;

  const worldStartX = -offsetX / zoom;
  const worldStartY = -offsetY / zoom;
  const worldEndX = worldStartX + canvasWidth / zoom;
  const worldEndY = worldStartY + canvasHeight / zoom;

  const startX = Math.floor(worldStartX / spacing) * spacing;
  const startY = Math.floor(worldStartY / spacing) * spacing;

  const horizontalCount = Math.ceil((worldEndX - startX) / spacing) + 1;
  const verticalCount = Math.ceil((worldEndY - startY) / spacing) + 1;
  const totalLines = horizontalCount + verticalCount;

  let renderSpacing = spacing;
  let renderAlpha = alpha;
  if (totalLines > PERF_GRID_LINE_THRESHOLD && quality === 'high') {
    renderSpacing = spacing * 2;
    renderAlpha = alpha * 1.2;
  } else if (totalLines > GRID_LINE_THRESHOLD && quality === 'medium') {
    renderSpacing = spacing * 2;
    renderAlpha = alpha * 1.2;
  }
  renderSpacing = Math.min(MAX_GRID_SPACING, renderSpacing);

  const gridStartX = Math.floor(worldStartX / renderSpacing) * renderSpacing;
  const gridStartY = Math.floor(worldStartY / renderSpacing) * renderSpacing;

  ctx.save();

  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${renderAlpha * 0.85})`;

  ctx.beginPath();
  for (let wx = gridStartX; wx <= worldEndX + renderSpacing; wx += renderSpacing) {
    const screenX = wx * zoom + offsetX;
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvasHeight);
  }
  for (let wy = gridStartY; wy <= worldEndY + renderSpacing; wy += renderSpacing) {
    const screenY = wy * zoom + offsetY;
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvasWidth, screenY);
  }
  ctx.stroke();

  const gradient = ctx.createRadialGradient(
    viewportCenterX, viewportCenterY, innerRadius,
    viewportCenterX, viewportCenterY, outerRadius
  );

  const centerAlpha = renderAlpha * (0.85 + centerBoostMax);
  const midAlpha = renderAlpha * 0.85;
  const edgeAlpha = renderAlpha * (0.85 - edgeDarken);

  gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${centerAlpha})`);
  gradient.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},${midAlpha})`);
  gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0.15, edgeAlpha)})`);

  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.restore();
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
  const h = sticky.height * zoom;
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
  updateFpsMetric();

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
