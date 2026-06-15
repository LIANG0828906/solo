import type { ViewRange, ExtremumPoint, InflectionPoint } from './analyzer';

export interface StyleOptions {
  curveColor: string;
  showGrid: boolean;
  showAxisLabels: boolean;
  gridDensity: number;
}

const PAD = { top: 30, right: 30, bottom: 45, left: 50 };

export function setupCanvas(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function xToPx(x: number, width: number, range: ViewRange): number {
  const plotW = width - PAD.left - PAD.right;
  return PAD.left + ((x - range.xMin) / (range.xMax - range.xMin)) * plotW;
}

export function yToPx(y: number, height: number, range: ViewRange): number {
  const plotH = height - PAD.top - PAD.bottom;
  return height - PAD.bottom - ((y - range.yMin) / (range.yMax - range.yMin)) * plotH;
}

export function pxToX(px: number, width: number, range: ViewRange): number {
  const plotW = width - PAD.left - PAD.right;
  return range.xMin + ((px - PAD.left) / plotW) * (range.xMax - range.xMin);
}

export function pxToY(py: number, height: number, range: ViewRange): number {
  const plotH = height - PAD.top - PAD.bottom;
  return range.yMax - ((py - PAD.top) / plotH) * (range.yMax - range.yMin);
}

function niceStep(step: number): number {
  if (step <= 0) return 1;
  const exp = Math.floor(Math.log10(step));
  const base = Math.pow(10, exp);
  const norm = step / base;
  if (norm <= 1.5) return base;
  if (norm <= 3) return 2 * base;
  if (norm <= 7) return 5 * base;
  return 10 * base;
}

export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, range: ViewRange, density: number): void {
  ctx.save();
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const xStep = niceStep(range.xTickStep / density);
  const yStep = niceStep(range.yTickStep / density);

  const xStart = Math.ceil(range.xMin / xStep) * xStep;
  for (let x = xStart; x <= range.xMax + xStep / 2; x += xStep) {
    const px = Math.round(xToPx(x, width, range)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, PAD.top);
    ctx.lineTo(px, height - PAD.bottom);
    ctx.stroke();
  }

  const yStart = Math.ceil(range.yMin / yStep) * yStep;
  for (let y = yStart; y <= range.yMax + yStep / 2; y += yStep) {
    const py = Math.round(yToPx(y, height, range)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, py);
    ctx.lineTo(width - PAD.right, py);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawAxes(ctx: CanvasRenderingContext2D, width: number, height: number, range: ViewRange, showLabels: boolean): void {
  ctx.save();
  ctx.strokeStyle = '#212121';
  ctx.fillStyle = '#212121';
  ctx.lineWidth = 1.5;
  ctx.font = '12px "Noto Sans SC", sans-serif';
  ctx.textBaseline = 'middle';

  const yZero = Math.max(PAD.top, Math.min(height - PAD.bottom, yToPx(0, height, range)));
  const xZero = Math.max(PAD.left, Math.min(width - PAD.right, xToPx(0, width, range)));

  ctx.beginPath();
  ctx.moveTo(PAD.left, yZero);
  ctx.lineTo(width - PAD.right + 4, yZero);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width - PAD.right + 4, yZero);
  ctx.lineTo(width - PAD.right - 6, yZero - 5);
  ctx.lineTo(width - PAD.right - 6, yZero + 5);
  ctx.closePath();
  ctx.fill();

  if (showLabels) {
    ctx.textAlign = 'left';
    ctx.fillText('x', width - PAD.right + 8, yZero - 10);
  }

  ctx.beginPath();
  ctx.moveTo(xZero, height - PAD.bottom);
  ctx.lineTo(xZero, PAD.top - 4);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xZero, PAD.top - 4);
  ctx.lineTo(xZero - 5, PAD.top + 6);
  ctx.lineTo(xZero + 5, PAD.top + 6);
  ctx.closePath();
  ctx.fill();

  if (showLabels) {
    ctx.textAlign = 'left';
    ctx.fillText('y', xZero + 8, PAD.top - 4);
  }

  const xTickStep = niceStep(range.xTickStep);
  const yTickStep = niceStep(range.yTickStep);

  ctx.font = '11px "Noto Sans SC", sans-serif';
  ctx.strokeStyle = '#212121';
  ctx.lineWidth = 1;

  const xStart = Math.ceil(range.xMin / xTickStep) * xTickStep;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let x = xStart; x <= range.xMax + xTickStep / 2; x += xTickStep) {
    if (Math.abs(x) < xTickStep / 1000) continue;
    const px = xToPx(x, width, range);
    const py = yZero;

    ctx.beginPath();
    ctx.moveTo(px, py - 3);
    ctx.lineTo(px, py + 3);
    ctx.stroke();

    if (showLabels) {
      ctx.fillText(formatTick(x), px, py + 6);
    }
  }

  const yStart = Math.ceil(range.yMin / yTickStep) * yTickStep;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = yStart; y <= range.yMax + yTickStep / 2; y += yTickStep) {
    if (Math.abs(y) < yTickStep / 1000) continue;
    const px = xZero;
    const py = yToPx(y, height, range);

    ctx.beginPath();
    ctx.moveTo(px - 3, py);
    ctx.lineTo(px + 3, py);
    ctx.stroke();

    if (showLabels) {
      ctx.fillText(formatTick(y), px - 6, py);
    }
  }

  if (showLabels && range.xMin <= 0 && range.xMax >= 0 && range.yMin <= 0 && range.yMax >= 0) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', xZero - 6, yZero + 6);
  }

  ctx.restore();
}

function formatTick(v: number): string {
  if (Math.abs(v) < 1e-10) return '0';
  const abs = Math.abs(v);
  if (abs >= 1000 || abs < 0.01) {
    return v.toExponential(1).replace(/e\+?(-?)0*(\d)/, 'e$1$2');
  }
  const decimals = abs < 1 ? 2 : abs < 10 ? 2 : 1;
  let s = v.toFixed(decimals);
  s = s.replace(/\.?0+$/, '');
  return s;
}

export function drawCurve(
  ctx: CanvasRenderingContext2D,
  f: (x: number) => number,
  width: number,
  height: number,
  range: ViewRange,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const plotW = width - PAD.left - PAD.right;
  const step = Math.max(0.1, (range.xMax - range.xMin) / (plotW * 2));
  const yMin = range.yMin;
  const yMax = range.yMax;
  const pad = (yMax - yMin) * 2;

  ctx.beginPath();
  let drawing = false;
  let prevPy = 0;
  const nSteps = Math.ceil((range.xMax - range.xMin) / step);

  for (let i = 0; i <= nSteps; i++) {
    const x = range.xMin + i * step;
    const y = f(x);

    if (!isFinite(y)) {
      drawing = false;
      continue;
    }

    const px = xToPx(x, width, range);
    const py = yToPx(y, height, range);

    const outside = y < yMin - pad || y > yMax + pad;

    if (!drawing) {
      if (!outside) {
        ctx.moveTo(px, py);
        drawing = true;
        prevPy = py;
      }
      continue;
    }

    const crossing = (y < yMin && prevPy > height - PAD.bottom) ||
                     (y > yMax && prevPy < PAD.top) ||
                     (prevPy < PAD.top && py > height - PAD.bottom) ||
                     (prevPy > height - PAD.bottom && py < PAD.top);

    if (crossing || Math.abs(py - prevPy) > height * 2) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
    prevPy = py;

    if (outside) {
      drawing = false;
    }
  }

  ctx.stroke();
  ctx.restore();
}

export function drawAll(
  ctx: CanvasRenderingContext2D,
  f: (x: number) => number | null,
  width: number,
  height: number,
  range: ViewRange,
  style: StyleOptions
): void {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(PAD.left, PAD.top, width - PAD.left - PAD.right, height - PAD.top - PAD.bottom);
  ctx.restore();

  if (style.showGrid) {
    drawGrid(ctx, width, height, range, style.gridDensity);
  }

  drawAxes(ctx, width, height, range, style.showAxisLabels);

  if (f) {
    drawCurve(ctx, f as (x: number) => number, width, height, range, style.curveColor);
  }
}

export interface MarkerOptions {
  animationProgress: number;
}

export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  extrema: ExtremumPoint[],
  inflections: InflectionPoint[],
  width: number,
  height: number,
  range: ViewRange,
  options: MarkerOptions
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const alpha = Math.min(1, Math.max(0, options.animationProgress));
  if (alpha <= 0) {
    ctx.restore();
    return;
  }

  ctx.globalAlpha = alpha;

  for (const p of extrema) {
    if (p.x < range.xMin || p.x > range.xMax) continue;
    if (p.y < range.yMin - 1 || p.y > range.yMax + 1) continue;

    const px = xToPx(p.x, width, range);
    const py = yToPx(p.y, height, range);

    ctx.save();
    ctx.fillStyle = '#e53935';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawLabel(ctx, `(${formatCoord(p.x)}, ${formatCoord(p.y)})`, px, py, height);
  }

  for (const p of inflections) {
    if (p.x < range.xMin || p.x > range.xMax) continue;
    if (p.y < range.yMin - 1 || p.y > range.yMax + 1) continue;

    const px = xToPx(p.x, width, range);
    const py = yToPx(p.y, height, range);

    ctx.save();
    ctx.fillStyle = '#43a047';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-3.5, -3.5, 7, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawLabel(ctx, `(${formatCoord(p.x)}, ${formatCoord(p.y)})`, px, py, height);
  }

  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, px: number, py: number, _height: number): void {
  ctx.save();
  ctx.font = '11px "Noto Sans SC", sans-serif';
  const metrics = ctx.measureText(text);
  const tw = metrics.width + 12;
  const th = 18;

  let lx = px + 8;
  let ly = py - 10 - th;

  if (lx + tw > (_height > 0 ? 9999 : 0) || false) {
    lx = px - tw - 8;
  }
  if (ly < 4) {
    ly = py + 10;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;

  const r = 4;
  ctx.beginPath();
  ctx.moveTo(lx + r, ly);
  ctx.lineTo(lx + tw - r, ly);
  ctx.quadraticCurveTo(lx + tw, ly, lx + tw, ly + r);
  ctx.lineTo(lx + tw, ly + th - r);
  ctx.quadraticCurveTo(lx + tw, ly + th, lx + tw - r, ly + th);
  ctx.lineTo(lx + r, ly + th);
  ctx.quadraticCurveTo(lx, ly + th, lx, ly + th - r);
  ctx.lineTo(lx, ly + r);
  ctx.quadraticCurveTo(lx, ly, lx + r, ly);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#212121';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, lx + 6, ly + th / 2);

  ctx.restore();
}

function formatCoord(v: number): string {
  if (Math.abs(v) < 1e-10) return '0';
  const abs = Math.abs(v);
  if (abs >= 10000 || abs < 0.001) return v.toExponential(2);
  return Number(v.toFixed(4)).toString();
}
