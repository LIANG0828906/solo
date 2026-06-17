import {
  FlavorProfile,
  FlavorDimension,
  DIMENSION_ORDER,
  DIMENSION_LABELS,
  RenderResult,
  RenderHitRegion,
} from '@/shared/types';

const GRID_LEVELS = 5;
const AXIS_LINE_COLOR = '#8E8EB2';
const GRID_LINE_COLOR = 'rgba(45, 45, 68, 0.5)';
const LABEL_COLOR = '#8E8EB2';
const LABEL_FONT = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const TITLE_FONT = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const TITLE_COLOR = '#FFFFFF';

function getPolygonPoints(
  centerX: number,
  centerY: number,
  radius: number,
  sides: number,
  startAngle: number = -Math.PI / 2,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / sides;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return points;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number,
  sides: number,
): void {
  for (let level = 1; level <= GRID_LEVELS; level++) {
    const radius = (maxRadius * level) / GRID_LEVELS;
    const points = getPolygonPoints(centerX, centerY, radius, sides);

    ctx.beginPath();
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;

    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number,
  sides: number,
): void {
  const axisPoints = getPolygonPoints(centerX, centerY, maxRadius, sides);

  ctx.beginPath();
  ctx.strokeStyle = AXIS_LINE_COLOR;
  ctx.lineWidth = 1;

  axisPoints.forEach((p) => {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number,
  labelRadius: number,
): void {
  const sides = DIMENSION_ORDER.length;
  const labelPoints = getPolygonPoints(centerX, centerY, labelRadius, sides);

  ctx.fillStyle = LABEL_COLOR;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  DIMENSION_ORDER.forEach((dim: FlavorDimension, i) => {
    const p = labelPoints[i];
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;

    let offsetX = 0;
    let offsetY = 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    if (Math.abs(cos) > 0.9) {
      ctx.textAlign = cos > 0 ? 'left' : 'right';
      offsetX = cos > 0 ? 8 : -8;
    } else {
      ctx.textAlign = 'center';
    }

    if (Math.abs(sin) > 0.9) {
      ctx.textBaseline = sin > 0 ? 'top' : 'bottom';
      offsetY = sin > 0 ? 8 : -8;
    } else {
      ctx.textBaseline = 'middle';
    }

    ctx.fillText(DIMENSION_LABELS[dim], p.x + offsetX, p.y + offsetY);
  });

  void maxRadius;
}

function drawProfile(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number,
  profile: FlavorProfile,
): Path2D {
  const sides = DIMENSION_ORDER.length;
  const path = new Path2D();

  DIMENSION_ORDER.forEach((dim: FlavorDimension, i) => {
    const score = profile.scores[dim];
    const radius = (maxRadius * score) / 10;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  path.closePath();

  ctx.save();
  ctx.fillStyle = hexToRgba(profile.color, 0.2);
  ctx.fill(path);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = profile.color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();

  DIMENSION_ORDER.forEach((dim: FlavorDimension, i) => {
    const score = profile.scores[dim];
    const radius = (maxRadius * score) / 10;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = profile.color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  return path;
}

export function renderRadarChart(
  canvas: HTMLCanvasElement,
  profiles: FlavorProfile[],
  width: number,
  height: number,
  title?: string,
): RenderResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { hitRegions: [] };

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = 60;
  const topPadding = title ? 50 : 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - topPadding - padding;
  const size = Math.min(chartWidth, chartHeight);
  const maxRadius = size / 2;
  const centerX = width / 2;
  const centerY = topPadding + maxRadius;
  const labelRadius = maxRadius + 24;
  const sides = DIMENSION_ORDER.length;

  if (title) {
    ctx.save();
    ctx.fillStyle = TITLE_COLOR;
    ctx.font = TITLE_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, centerX, 16);
    ctx.restore();
  }

  drawGrid(ctx, centerX, centerY, maxRadius, sides);
  drawAxes(ctx, centerX, centerY, maxRadius, sides);
  drawLabels(ctx, centerX, centerY, maxRadius, labelRadius);

  const hitRegions: RenderHitRegion[] = [];
  const visibleProfiles = profiles.filter((p) => p.visible);

  visibleProfiles.forEach((profile) => {
    const path = drawProfile(ctx, centerX, centerY, maxRadius, profile);
    hitRegions.push({ profileId: profile.id, path });
  });

  return { hitRegions };
}

export function exportRadarChart(
  profiles: FlavorProfile[],
  exportWidth: number = 1920,
  exportHeight: number = 1080,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const padding = 120;
  const topPadding = 100;
  const chartWidth = exportWidth - padding * 2;
  const chartHeight = exportHeight - topPadding - padding;
  const size = Math.min(chartWidth, chartHeight);
  const maxRadius = size / 2;
  const centerX = exportWidth / 2;
  const centerY = topPadding + maxRadius;
  const labelRadius = maxRadius + 48;
  const sides = DIMENSION_ORDER.length;

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('风味试纸 - 调味料风味雷达对比图', centerX, 32);
  ctx.restore();

  for (let level = 1; level <= GRID_LEVELS; level++) {
    const radius = (maxRadius * level) / GRID_LEVELS;
    const points = getPolygonPoints(centerX, centerY, radius, sides);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(45, 45, 68, 0.6)';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  const axisPoints = getPolygonPoints(centerX, centerY, maxRadius, sides);
  ctx.beginPath();
  ctx.strokeStyle = '#555577';
  ctx.lineWidth = 2;
  axisPoints.forEach((p) => {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  const labelPoints = getPolygonPoints(centerX, centerY, labelRadius, sides);
  ctx.fillStyle = '#333355';
  ctx.font = '26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  DIMENSION_ORDER.forEach((dim: FlavorDimension, i) => {
    const p = labelPoints[i];
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    if (Math.abs(cos) > 0.9) {
      ctx.textAlign = cos > 0 ? 'left' : 'right';
    } else {
      ctx.textAlign = 'center';
    }
    if (Math.abs(sin) > 0.9) {
      ctx.textBaseline = sin > 0 ? 'top' : 'bottom';
    } else {
      ctx.textBaseline = 'middle';
    }
    ctx.fillText(DIMENSION_LABELS[dim], p.x, p.y);
  });

  const visibleProfiles = profiles.filter((p) => p.visible);
  visibleProfiles.forEach((profile) => {
    const path = new Path2D();
    DIMENSION_ORDER.forEach((dim: FlavorDimension, i) => {
      const score = profile.scores[dim];
      const radius = (maxRadius * score) / 10;
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.closePath();

    ctx.fillStyle = hexToRgba(profile.color, 0.25);
    ctx.fill(path);
    ctx.strokeStyle = profile.color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke(path);

    DIMENSION_ORDER.forEach((dim: FlavorDimension, i) => {
      const score = profile.scores[dim];
      const radius = (maxRadius * score) / 10;
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = profile.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  });

  if (visibleProfiles.length > 0) {
    const legendX = padding;
    const legendY = exportHeight - padding + 20;
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    let offsetX = 0;

    visibleProfiles.forEach((profile) => {
      ctx.beginPath();
      ctx.arc(legendX + offsetX + 14, legendY, 12, 0, Math.PI * 2);
      ctx.fillStyle = profile.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#333355';
      ctx.fillText(profile.name, legendX + offsetX + 34, legendY);
      offsetX += ctx.measureText(profile.name).width + 70;
    });
  }

  return canvas.toDataURL('image/png');
}
