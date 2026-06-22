export interface HeatmapConfig {
  width: number;
  height: number;
  opacity: number;
  smoothing: number;
}

const COLOR_STOPS = [
  { pos: 0.0, r: 0, g: 0, b: 255 },
  { pos: 0.25, r: 0, g: 128, b: 255 },
  { pos: 0.5, r: 0, g: 255, b: 128 },
  { pos: 0.75, r: 255, g: 255, b: 0 },
  { pos: 1.0, r: 255, g: 0, b: 0 },
];

let currentField: number[][] | null = null;
let targetField: number[][] | null = null;
let animProgress = 1;
let animFrame: number | null = null;

export function renderHeatmap(
  canvas: HTMLCanvasElement,
  pressureField: number[][],
  config: HeatmapConfig
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height, opacity } = config;
  canvas.width = width;
  canvas.height = height;

  targetField = pressureField;

  if (!currentField || currentField.length !== pressureField.length ||
      currentField[0]?.length !== pressureField[0]?.length) {
    currentField = pressureField.map(row => [...row]);
    animProgress = 1;
  } else {
    animProgress = 0;
  }

  drawField(ctx, currentField, width, height, opacity);
}

export function animateToTarget(
  canvas: HTMLCanvasElement,
  config: HeatmapConfig
): void {
  if (animFrame) cancelAnimationFrame(animFrame);

  const step = () => {
    if (!currentField || !targetField) return;

    animProgress = Math.min(1, animProgress + 0.12);
    const t = easeInOutCubic(animProgress);

    const rows = currentField.length;
    const cols = currentField[0]?.length ?? 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const curr = currentField[r][c];
        const tgt = targetField[r]?.[c] ?? curr;
        currentField[r][c] = curr + (tgt - curr) * t;
      }
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawField(ctx, currentField, canvas.width, canvas.height, config.opacity);
    }

    if (animProgress < 1) {
      animFrame = requestAnimationFrame(step);
    }
  };

  animFrame = requestAnimationFrame(step);
}

function drawField(
  ctx: CanvasRenderingContext2D,
  field: number[][],
  canvasWidth: number,
  canvasHeight: number,
  opacity: number
): void {
  const rows = field.length;
  const cols = field[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return;

  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (field[r][c] < minVal) minVal = field[r][c];
      if (field[r][c] > maxVal) maxVal = field[r][c];
    }
  }
  const range = maxVal - minVal || 1;

  const imageData = ctx.createImageData(canvasWidth, canvasHeight);
  const data = imageData.data;
  const cellW = canvasWidth / cols;
  const cellH = canvasHeight / rows;

  for (let py = 0; py < canvasHeight; py++) {
    const r = Math.min(rows - 1, Math.floor(py / cellH));
    for (let px = 0; px < canvasWidth; px++) {
      const c = Math.min(cols - 1, Math.floor(px / cellW));
      const norm = (field[r][c] - minVal) / range;
      const color = interpolateColor(norm);
      const idx = (py * canvasWidth + px) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = Math.round(opacity * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  drawColorBar(ctx, canvasWidth, canvasHeight, minVal, maxVal);
}

function drawColorBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  minVal: number,
  maxVal: number
): void {
  const barW = 16;
  const barH = h - 60;
  const barX = w - barW - 12;
  const barY = 30;

  const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
  for (const stop of COLOR_STOPS) {
    grad.addColorStop(1 - stop.pos, `rgb(${stop.r},${stop.g},${stop.b})`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(barX, barY, barW, barH);

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#E0E0E0';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText(`${maxVal.toFixed(1)} dB`, barX - 4, barY + 8);
  ctx.fillText(`${minVal.toFixed(1)} dB`, barX - 4, barY + barH);
  const mid = (minVal + maxVal) / 2;
  ctx.fillText(`${mid.toFixed(1)} dB`, barX - 4, barY + barH / 2 + 3);
}

function interpolateColor(norm: number): { r: number; g: number; b: number } {
  const clamped = Math.max(0, Math.min(1, norm));
  let lower = COLOR_STOPS[0];
  let upper = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (clamped >= COLOR_STOPS[i].pos && clamped <= COLOR_STOPS[i + 1].pos) {
      lower = COLOR_STOPS[i];
      upper = COLOR_STOPS[i + 1];
      break;
    }
  }
  const t = (clamped - lower.pos) / (upper.pos - lower.pos || 1);
  return {
    r: Math.round(lower.r + (upper.r - lower.r) * t),
    g: Math.round(lower.g + (upper.g - lower.g) * t),
    b: Math.round(lower.b + (upper.b - lower.b) * t),
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function resetHeatmapState(): void {
  currentField = null;
  targetField = null;
  animProgress = 1;
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
}
