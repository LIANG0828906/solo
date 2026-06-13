import { FloorplanData, Point } from './floorplan';
import { StylePreset, interpolateColorHSL, hexToHSL } from './styleLibrary';
import { RoomStyleState } from './store';

const GRADIENT_STEPS = 8;

export interface RenderState {
  hoveredRoom: string | null;
  selectedRoom: string | null;
  selectionPhase: number;
  roomStyles: Record<string, RoomStyleState>;
  animatingRooms: Map<string, AnimationState>;
  dirtyRects: DOMRect[];
}

export interface AnimationState {
  fromStyle: RoomStyleState;
  toStyle: RoomStyleState;
  startTime: number;
  duration: number;
}

export function createRenderState(): RenderState {
  return {
    hoveredRoom: null,
    selectedRoom: null,
    selectionPhase: 0,
    roomStyles: {},
    animatingRooms: new Map(),
    dirtyRects: []
  };
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[]
): void {
  if (points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

function getPolygonBounds(points: Point[]): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function createFloorPattern(
  ctx: CanvasRenderingContext2D,
  floorColor: string,
  _roomName: string
): CanvasPattern | null {
  const patCanvas = document.createElement('canvas');
  patCanvas.width = 20;
  patCanvas.height = 20;
  const pctx = patCanvas.getContext('2d');
  if (!pctx) return null;

  const hsl = hexToHSL(floorColor);
  pctx.fillStyle = floorColor;
  pctx.fillRect(0, 0, 20, 20);

  const lineL = Math.max(0, hsl.l - 8);
  pctx.strokeStyle = `hsl(${hsl.h}, ${hsl.s}%, ${lineL}%)`;
  pctx.lineWidth = 0.5;
  pctx.beginPath();
  pctx.moveTo(0, 20);
  pctx.lineTo(20, 0);
  pctx.stroke();
  pctx.beginPath();
  pctx.moveTo(10, 20);
  pctx.lineTo(20, 10);
  pctx.stroke();
  pctx.beginPath();
  pctx.moveTo(0, 10);
  pctx.lineTo(10, 0);
  pctx.stroke();

  return ctx.createPattern(patCanvas, 'repeat');
}

function createLightingGradient(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number },
  style: StylePreset
): CanvasGradient {
  const angle = (style.gradientAngle * Math.PI) / 180;
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const halfDiag = Math.sqrt(bounds.w * bounds.w + bounds.h * bounds.h) / 2;

  const x0 = cx - Math.cos(angle) * halfDiag;
  const y0 = cy - Math.sin(angle) * halfDiag;
  const x1 = cx + Math.cos(angle) * halfDiag;
  const y1 = cy + Math.sin(angle) * halfDiag;

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

  const intensity = style.shadowIntensity;
  const spread = style.gradientSpread;
  const baseL = hexToHSL(style.wallColor).l;

  for (let i = 0; i <= GRADIENT_STEPS; i++) {
    const t = i / GRADIENT_STEPS;
    const lightness = baseL * (1 - t * spread * intensity * 2);
    const clampedL = Math.max(0, Math.min(100, lightness));
    const hsl = hexToHSL(style.wallColor);
    const stopColor = `hsl(${hsl.h}, ${hsl.s}%, ${clampedL}%)`;
    gradient.addColorStop(t, stopColor);
  }

  return gradient;
}

export function renderRoom(
  ctx: CanvasRenderingContext2D,
  room: { name: string; polygon: Point[] },
  styleState: RoomStyleState,
  stylePreset: StylePreset,
  isHovered: boolean,
  isSelected: boolean,
  selectionPhase: number
): void {
  const bounds = getPolygonBounds(room.polygon);

  ctx.save();

  drawPolygon(ctx, room.polygon);
  ctx.clip();

  const floorPattern = createFloorPattern(ctx, styleState.floorColor, room.name);
  if (floorPattern) {
    ctx.fillStyle = floorPattern;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  const gradient = createLightingGradient(ctx, bounds, stylePreset);
  ctx.fillStyle = gradient;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

  drawPolygon(ctx, room.polygon);
  ctx.fillStyle = styleState.furnitureColor + '33';
  const cx = bounds.x + bounds.w * 0.45;
  const cy = bounds.y + bounds.h * 0.5;
  const fw = bounds.w * 0.35;
  const fh = bounds.h * 0.25;
  ctx.fillRect(cx - fw / 2, cy - fh / 2, fw, fh);

  if (isHovered && !isSelected) {
    drawPolygon(ctx, room.polygon);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
  }

  ctx.restore();

  ctx.save();
  drawPolygon(ctx, room.polygon);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  if (isSelected) {
    ctx.save();
    drawPolygon(ctx, room.polygon);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -selectionPhase;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  const textX = bounds.x + bounds.w / 2;
  const textY = bounds.y + bounds.h / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(room.name).width;
  ctx.fillRect(textX - tw / 2 - 6, textY - 10, tw + 12, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(room.name, textX, textY);
  ctx.restore();
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  floorplan: FloorplanData,
  state: RenderState,
  stylePresets: Map<string, StylePreset>,
  now: number
): void {
  const canvas = ctx.canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const selectionPhase = (now / 500) * 12;
  state.selectionPhase = selectionPhase;

  for (const room of floorplan.rooms) {
    let currentStyle = state.roomStyles[room.name];
    const anim = state.animatingRooms.get(room.name);

    if (anim) {
      const elapsed = now - anim.startTime;
      const t = Math.min(1, elapsed / anim.duration);
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      currentStyle = {
        wallColor: interpolateColorHSL(anim.fromStyle.wallColor, anim.toStyle.wallColor, easedT),
        floorColor: interpolateColorHSL(anim.fromStyle.floorColor, anim.toStyle.floorColor, easedT),
        furnitureColor: interpolateColorHSL(anim.fromStyle.furnitureColor, anim.toStyle.furnitureColor, easedT),
        styleId: t >= 1 ? anim.toStyle.styleId : anim.fromStyle.styleId
      };

      if (t >= 1) {
        state.roomStyles[room.name] = anim.toStyle;
        state.animatingRooms.delete(room.name);
      }
    }

    if (!currentStyle) continue;

    const preset = stylePresets.get(currentStyle.styleId);
    if (!preset) continue;

    const isHovered = state.hoveredRoom === room.name;
    const isSelected = state.selectedRoom === room.name;

    renderRoom(
      ctx,
      room,
      currentStyle,
      preset,
      isHovered,
      isSelected,
      selectionPhase
    );
  }
}

export function renderExportFrame(
  ctx: CanvasRenderingContext2D,
  floorplan: FloorplanData,
  state: RenderState,
  stylePresets: Map<string, StylePreset>
): void {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const room of floorplan.rooms) {
    const currentStyle = state.roomStyles[room.name];
    if (!currentStyle) continue;
    const preset = stylePresets.get(currentStyle.styleId);
    if (!preset) continue;

    renderRoom(ctx, room, currentStyle, preset, false, false, 0);
  }
}
