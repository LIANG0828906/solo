import { FlavorDimension, FLAVOR_DIMENSIONS, TeaVariety, calculateFlavorProfile } from '../utils/flavorProfile';

export interface RadarConfig {
  centerX: number;
  centerY: number;
  radius: number;
  levels: number;
}

export function drawFlavorRadar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  defaultFlavor: Record<FlavorDimension, number>,
  currentFlavor: Record<FlavorDimension, number>,
  teaColor: string,
  temperature: number,
  brewTime: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.38;
  const levels = 5;

  ctx.clearRect(0, 0, width, height);

  drawHexGrid(ctx, centerX, centerY, radius, levels);

  drawAxes(ctx, centerX, centerY, radius);

  drawAxisLabels(ctx, centerX, centerY, radius);

  drawFlavorPolygon(ctx, centerX, centerY, radius, defaultFlavor, '#D3D3D3', 0.4, false);

  drawFlavorPolygon(ctx, centerX, centerY, radius, currentFlavor, teaColor, 0.6, true);

  drawCenterDisc(ctx, centerX, centerY, temperature, brewTime);
}

function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  levels: number
): void {
  ctx.strokeStyle = '#D2B48C';
  ctx.lineWidth = 1;

  for (let level = 1; level <= levels; level++) {
    const r = (radius * level) / levels;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.strokeStyle = '#A0522D';
  ctx.lineWidth = 1;

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.fillStyle = '#3E2723';
  ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const labelRadius = radius + 25;

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + labelRadius * Math.cos(angle);
    const y = cy + labelRadius * Math.sin(angle);
    ctx.fillText(FLAVOR_DIMENSIONS[i], x, y);
  }
}

function getFlavorPoints(
  cx: number,
  cy: number,
  radius: number,
  flavor: Record<FlavorDimension, number>
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const value = flavor[FLAVOR_DIMENSIONS[i]] || 0;
    const r = (radius * value) / 10;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push({ x, y });
  }

  return points;
}

function drawFlavorPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  flavor: Record<FlavorDimension, number>,
  color: string,
  alpha: number,
  glow: boolean
): void {
  const points = getFlavorPoints(cx, cy, radius, flavor);

  if (glow) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  });
  ctx.closePath();

  ctx.fillStyle = hexToRgba(color, alpha);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = glow ? 2 : 1;
  ctx.stroke();

  if (glow) {
    ctx.restore();

    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}

function drawCenterDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  temperature: number,
  brewTime: number
): void {
  const discRadius = 30;

  const tempRatio = (temperature - 60) / 40;
  const timeRatio = (brewTime - 30) / 270;

  const hue = 30 + tempRatio * 30;
  const saturation = 50 + timeRatio * 30;
  const lightness = 70 - tempRatio * 20;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, discRadius);
  gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness + 10}%, 0.8)`);
  gradient.addColorStop(0.6, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`);
  gradient.addColorStop(1, `hsla(${hue}, ${saturation - 10}%, ${lightness - 10}%, 0.3)`);

  ctx.beginPath();
  ctx.arc(cx, cy, discRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(200, 200, 200, ${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateThumbnail(
  tea: TeaVariety,
  temperature: number,
  brewTime: number,
  size: number = 300
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const defaultFlavor = tea.defaultFlavor;
  const currentFlavor = calculateFlavorProfile(tea, temperature, brewTime);

  drawFlavorRadar(ctx, size, size, defaultFlavor, currentFlavor, tea.color, temperature, brewTime);

  return canvas.toDataURL('image/png');
}

export function generateThumbnailFromFlavor(
  defaultFlavor: Record<FlavorDimension, number>,
  currentFlavor: Record<FlavorDimension, number>,
  teaColor: string,
  temperature: number,
  brewTime: number,
  size: number = 300
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawFlavorRadar(ctx, size, size, defaultFlavor, currentFlavor, teaColor, temperature, brewTime);

  return canvas.toDataURL('image/png');
}
