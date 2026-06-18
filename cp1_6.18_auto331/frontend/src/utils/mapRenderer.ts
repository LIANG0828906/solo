import { MapMarker, Note, FAMILY_POSITIONS, FAMILY_COLORS } from '../types';
import { lerpColor } from './helpers';

interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  markers: MapMarker[];
  zoom: number;
  offset: { x: number; y: number };
  notes: Note[];
}

export function renderMap(options: RenderOptions) {
  const { ctx, width, height, markers, zoom, offset } = options;

  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0A0E27');
  gradient.addColorStop(1, '#1A237E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  drawContinents(ctx, width, height, zoom, offset);
  drawConnections(ctx, markers, width, height, zoom, offset);
  drawMarkers(ctx, markers, width, height, zoom, offset);
}

function drawContinents(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  offset: { x: number; y: number }
) {
  ctx.save();
  ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;

  const continents = [
    [
      { x: 0.05, y: 0.1 },
      { x: 0.25, y: 0.08 },
      { x: 0.3, y: 0.25 },
      { x: 0.22, y: 0.35 },
      { x: 0.1, y: 0.32 },
      { x: 0.03, y: 0.2 },
    ],
    [
      { x: 0.35, y: 0.15 },
      { x: 0.55, y: 0.12 },
      { x: 0.58, y: 0.3 },
      { x: 0.5, y: 0.38 },
      { x: 0.38, y: 0.35 },
      { x: 0.32, y: 0.25 },
    ],
    [
      { x: 0.58, y: 0.1 },
      { x: 0.85, y: 0.08 },
      { x: 0.9, y: 0.25 },
      { x: 0.85, y: 0.35 },
      { x: 0.7, y: 0.32 },
      { x: 0.58, y: 0.28 },
    ],
    [
      { x: 0.4, y: 0.38 },
      { x: 0.58, y: 0.38 },
      { x: 0.55, y: 0.65 },
      { x: 0.42, y: 0.68 },
      { x: 0.38, y: 0.55 },
    ],
    [
      { x: 0.05, y: 0.38 },
      { x: 0.2, y: 0.36 },
      { x: 0.22, y: 0.55 },
      { x: 0.15, y: 0.72 },
      { x: 0.05, y: 0.65 },
    ],
    [
      { x: 0.7, y: 0.5 },
      { x: 0.88, y: 0.48 },
      { x: 0.85, y: 0.62 },
      { x: 0.75, y: 0.65 },
      { x: 0.68, y: 0.58 },
    ],
    [
      { x: 0.2, y: 0.78 },
      { x: 0.5, y: 0.75 },
      { x: 0.6, y: 0.82 },
      { x: 0.35, y: 0.88 },
      { x: 0.18, y: 0.85 },
    ],
  ];

  continents.forEach((points) => {
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = p.x * width;
      const py = p.y * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  markers: MapMarker[],
  width: number,
  height: number,
  zoom: number,
  offset: { x: number; y: number }
) {
  if (markers.length < 2) return;

  ctx.save();
  ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);

  const sortedMarkers = [...markers].sort((a, b) => b.count - a.count);
  const mainMarker = sortedMarkers[0];

  for (let i = 1; i < Math.min(sortedMarkers.length, 6); i++) {
    const marker = sortedMarkers[i];
    const startX = mainMarker.x * width;
    const startY = mainMarker.y * height;
    const endX = marker.x * width;
    const endY = marker.y * height;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 - 50;

    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, `${mainMarker.color}40`);
    gradient.addColorStop(1, `${marker.color}40`);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: MapMarker[],
  width: number,
  height: number,
  zoom: number,
  offset: { x: number; y: number }
) {
  ctx.save();
  ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);

  const maxCount = Math.max(...markers.map((m) => m.count), 1);

  markers.forEach((marker) => {
    const cx = marker.x * width;
    const cy = marker.y * height;
    const sizeRatio = marker.count / maxCount;
    const diameter = 20 + sizeRatio * 60;
    const radius = diameter / 2;

    const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2);
    glowGradient.addColorStop(0, `${marker.color}40`);
    glowGradient.addColorStop(1, `${marker.color}00`);
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    const bodyGradient = ctx.createRadialGradient(
      cx - radius * 0.3,
      cy - radius * 0.3,
      0,
      cx,
      cy,
      radius
    );
    bodyGradient.addColorStop(0, `${marker.color}CC`);
    bodyGradient.addColorStop(1, `${marker.color}80`);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(marker.count.toString(), cx, cy);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '11px sans-serif';
    ctx.fillText(marker.family, cx, cy + radius + 14);
  });

  ctx.restore();
}

export function createMarkersFromNotes(notes: Note[]): MapMarker[] {
  const familyCounts: Record<string, number> = {};

  notes.forEach((note) => {
    const family = note.languageFamily || '其他';
    familyCounts[family] = (familyCounts[family] || 0) + 1;
  });

  const families = Object.keys(familyCounts);
  const maxCount = Math.max(...Object.values(familyCounts), 1);

  return families.map((family, index) => {
    const pos = FAMILY_POSITIONS[family] || { x: 0.2 + index * 0.1, y: 0.5 };
    const color = FAMILY_COLORS[family] || '#78909C';
    const count = familyCounts[family];

    const colorT = count / maxCount;
    const finalColor = lerpColor('#7C4DFF', '#FFD54F', colorT * 0.3 + index * 0.1);

    return {
      id: family,
      family,
      x: pos.x,
      y: pos.y,
      count,
      color: FAMILY_COLORS[family] || color,
    };
  });
}
