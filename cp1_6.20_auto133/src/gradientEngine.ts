export interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export type GradientType = 'linear' | 'radial' | 'conic';

export interface GradientConfig {
  id: string;
  name: string;
  type: GradientType;
  angle: number;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  colorStops: ColorStop[];
  createdAt: number;
}

export function createDefaultConfig(): GradientConfig {
  return {
    id: generateId(),
    name: '未命名渐变',
    type: 'linear',
    angle: 135,
    centerX: 50,
    centerY: 50,
    radiusX: 50,
    radiusY: 50,
    colorStops: [
      { id: generateId(), color: '#667eea', position: 0 },
      { id: generateId(), color: '#764ba2', position: 50 },
      { id: generateId(), color: '#f093fb', position: 100 }
    ],
    createdAt: Date.now()
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function renderGradient(
  ctx: CanvasRenderingContext2D,
  config: GradientConfig,
  width: number,
  height: number
): void {
  const startTime = performance.now();
  
  ctx.clearRect(0, 0, width, height);

  const sortedStops = [...config.colorStops].sort((a, b) => a.position - b.position);

  let gradient: CanvasGradient;

  switch (config.type) {
    case 'linear':
      gradient = createLinearGradient(ctx, config, width, height);
      break;
    case 'radial':
      gradient = createRadialGradient(ctx, config, width, height);
      break;
    case 'conic':
      gradient = createConicGradient(ctx, config, width, height);
      break;
    default:
      gradient = createLinearGradient(ctx, config, width, height);
  }

  sortedStops.forEach(stop => {
    gradient.addColorStop(stop.position / 100, stop.color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const endTime = performance.now();
  if (endTime - startTime > 50) {
    console.warn(`Gradient render took ${(endTime - startTime).toFixed(2)}ms, exceeds 50ms target`);
  }
}

function createLinearGradient(
  ctx: CanvasRenderingContext2D,
  config: GradientConfig,
  width: number,
  height: number
): CanvasGradient {
  const angleRad = (config.angle - 90) * (Math.PI / 180);
  const centerX = width / 2;
  const centerY = height / 2;
  const diagonal = Math.sqrt(width * width + height * height);
  const halfDiag = diagonal / 2;

  const x1 = centerX - Math.cos(angleRad) * halfDiag;
  const y1 = centerY - Math.sin(angleRad) * halfDiag;
  const x2 = centerX + Math.cos(angleRad) * halfDiag;
  const y2 = centerY + Math.sin(angleRad) * halfDiag;

  return ctx.createLinearGradient(x1, y1, x2, y2);
}

function createRadialGradient(
  ctx: CanvasRenderingContext2D,
  config: GradientConfig,
  width: number,
  height: number
): CanvasGradient {
  const cx = (config.centerX / 100) * width;
  const cy = (config.centerY / 100) * height;
  const rx = (config.radiusX / 100) * width;
  const ry = (config.radiusY / 100) * height;

  return ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
}

function createConicGradient(
  ctx: CanvasRenderingContext2D,
  config: GradientConfig,
  width: number,
  height: number
): CanvasGradient {
  const cx = (config.centerX / 100) * width;
  const cy = (config.centerY / 100) * height;
  const startAngle = (config.angle * Math.PI) / 180;

  const conicGradient = (ctx as any).createConicGradient
    ? (ctx as any).createConicGradient(startAngle, cx, cy)
    : ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) / 2);

  return conicGradient;
}

export function generateCSSCode(config: GradientConfig): string {
  const sortedStops = [...config.colorStops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
    case 'radial':
      return `radial-gradient(circle at ${config.centerX}% ${config.centerY}%, ${stopsStr})`;
    case 'conic':
      return `conic-gradient(from ${config.angle}deg at ${config.centerX}% ${config.centerY}%, ${stopsStr})`;
    default:
      return '';
  }
}

export function getLinearGradientPoints(
  config: GradientConfig,
  width: number,
  height: number
): { x1: number; y1: number; x2: number; y2: number } {
  const angleRad = (config.angle - 90) * (Math.PI / 180);
  const centerX = width / 2;
  const centerY = height / 2;
  const diagonal = Math.sqrt(width * width + height * height);
  const halfDiag = diagonal / 2;

  return {
    x1: centerX - Math.cos(angleRad) * halfDiag,
    y1: centerY - Math.sin(angleRad) * halfDiag,
    x2: centerX + Math.cos(angleRad) * halfDiag,
    y2: centerY + Math.sin(angleRad) * halfDiag
  };
}

export function calculateAngleFromPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  return angle;
}
