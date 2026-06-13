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
    animatingRooms: new Map()
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

const patternCache = new Map<string, CanvasPattern | null>();

function createFloorPattern(
  ctx: CanvasRenderingContext2D,
  floorColor: string
): CanvasPattern | null {
  const cached = patternCache.get(floorColor);
  if (cached !== undefined) return cached;

  const patCanvas = document.createElement('canvas');
  patCanvas.width = 20;
  patCanvas.height = 20;
  const pctx = patCanvas.getContext('2d');
  if (!pctx) {
    patternCache.set(floorColor, null);
    return null;
  }

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

  const pattern = ctx.createPattern(patCanvas, 'repeat');
  patternCache.set(floorColor, pattern);
  return pattern;
}

function createLightingGradient(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number },
  style: StylePreset
): CanvasGradient {
  const angleRad = (style.gradientAngle * Math.PI) / 180;

  const dirX = Math.cos(angleRad);
  const dirY = Math.sin(angleRad);

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const halfW = bounds.w / 2;
  const halfH = bounds.h / 2;

  const tMaxX = halfW / Math.abs(dirX || 0.0001);
  const tMaxY = halfH / Math.abs(dirY || 0.0001);
  const tMax = Math.min(tMaxX, tMaxY);

  const x0 = cx - dirX * tMax;
  const y0 = cy - dirY * tMax;
  const x1 = cx + dirX * tMax;
  const y1 = cy + dirY * tMax;

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

  const baseWallHsl = hexToHSL(style.wallColor);
  const intensity = style.shadowIntensity;
  const spread = style.gradientSpread;

  const midTLight = 0.5 - spread * 0.5;
  const midTDark = 0.5 + spread * 0.5;

  for (let i = 0; i <= GRADIENT_STEPS; i++) {
    const t = i / GRADIENT_STEPS;
    let lightnessFactor: number;

    if (t <= midTLight) {
      lightnessFactor = 1;
    } else if (t >= midTDark) {
      lightnessFactor = 1 - intensity;
    } else {
      const rangeT = (t - midTLight) / (midTDark - midTLight);
      const eased = rangeT * rangeT * (3 - 2 * rangeT);
      lightnessFactor = 1 - intensity * eased;
    }

    const l = baseWallHsl.l * lightnessFactor;
    const clampedL = Math.max(2, Math.min(98, l));
    const stopColor = `hsl(${baseWallHsl.h}, ${baseWallHsl.s}%, ${clampedL}%)`;
    gradient.addColorStop(t, stopColor);
  }

  return gradient;
}

export function renderRoomBase(
  ctx: CanvasRenderingContext2D,
  room: { name: string; polygon: Point[] },
  styleState: RoomStyleState,
  stylePreset: StylePreset
): void {
  const bounds = getPolygonBounds(room.polygon);

  ctx.save();
  drawPolygon(ctx, room.polygon);
  ctx.clip();

  const floorPattern = createFloorPattern(ctx, styleState.floorColor);
  if (floorPattern) {
    ctx.fillStyle = floorPattern;
    ctx.fillRect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);
  }

  const gradient = createLightingGradient(ctx, bounds, stylePreset);
  ctx.fillStyle = gradient;
  ctx.fillRect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);

  drawPolygon(ctx, room.polygon);
  ctx.fillStyle = styleState.furnitureColor + '33';
  const cx = bounds.x + bounds.w * 0.45;
  const cy = bounds.y + bounds.h * 0.5;
  const fw = bounds.w * 0.35;
  const fh = bounds.h * 0.25;
  ctx.fillRect(cx - fw / 2, cy - fh / 2, fw, fh);

  ctx.restore();

  ctx.save();
  drawPolygon(ctx, room.polygon);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

export function renderRoomLabel(
  ctx: CanvasRenderingContext2D,
  room: { name: string; polygon: Point[] }
): void {
  const bounds = getPolygonBounds(room.polygon);
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

export function renderRoomHover(
  ctx: CanvasRenderingContext2D,
  room: { name: string; polygon: Point[] }
): void {
  ctx.save();
  drawPolygon(ctx, room.polygon);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fill();
  ctx.restore();
}

export function renderRoomSelection(
  ctx: CanvasRenderingContext2D,
  room: { name: string; polygon: Point[] },
  selectionPhase: number
): void {
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

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private floorplan: FloorplanData;
  private state: RenderState;
  private stylePresets: Map<string, StylePreset>;
  private bgCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContext2D;
  private bgDirty: boolean = true;
  private bgDirtyRooms: Set<string> = new Set();
  private lastHovered: string | null = null;
  private lastSelected: string | null = null;
  private lastAnimCount: number = 0;
  private rafId: number = 0;
  private running: boolean = false;
  private needsRender: boolean = true;

  constructor(
    ctx: CanvasRenderingContext2D,
    floorplan: FloorplanData,
    state: RenderState,
    stylePresets: Map<string, StylePreset>
  ) {
    this.ctx = ctx;
    this.floorplan = floorplan;
    this.state = state;
    this.stylePresets = stylePresets;

    this.bgCanvas = document.createElement('canvas');
    const bgCtx = this.bgCanvas.getContext('2d');
    if (!bgCtx) throw new Error('Cannot create bg canvas context');
    this.bgCtx = bgCtx;

    this.resizeBackground();
  }

  resizeBackground(): void {
    const canvas = this.ctx.canvas;
    this.bgCanvas.width = canvas.width;
    this.bgCanvas.height = canvas.height;
    this.bgDirty = true;
    this.needsRender = true;
    patternCache.clear();
  }

  markRoomDirty(roomName: string): void {
    this.bgDirtyRooms.add(roomName);
    this.needsRender = true;
  }

  markAllDirty(): void {
    this.bgDirty = true;
    this.bgDirtyRooms.clear();
    this.needsRender = true;
  }

  private rebuildBackground(): void {
    if (this.bgDirty) {
      this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
      for (const room of this.floorplan.rooms) {
        const styleState = this.state.roomStyles[room.name];
        if (!styleState) continue;
        const preset = this.stylePresets.get(styleState.styleId);
        if (!preset) continue;
        renderRoomBase(this.bgCtx, room, styleState, preset);
      }
      this.bgDirty = false;
      this.bgDirtyRooms.clear();
      return;
    }

    for (const roomName of this.bgDirtyRooms) {
      const room = this.floorplan.rooms.find(r => r.name === roomName);
      if (!room) continue;
      const styleState = this.state.roomStyles[roomName];
      if (!styleState) continue;
      const preset = this.stylePresets.get(styleState.styleId);
      if (!preset) continue;

      const bounds = getPolygonBounds(room.polygon);
      const pad = 4;
      this.bgCtx.clearRect(
        bounds.x - pad, bounds.y - pad,
        bounds.w + pad * 2, bounds.h + pad * 2
      );
      renderRoomBase(this.bgCtx, room, styleState, preset);
    }
    this.bgDirtyRooms.clear();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      this.renderFrame(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private renderFrame(now: number): void {
    const state = this.state;
    const canvas = this.ctx.canvas;

    let dynamicChanged = false;

    if (this.lastHovered !== state.hoveredRoom) {
      this.lastHovered = state.hoveredRoom;
      dynamicChanged = true;
    }
    if (this.lastSelected !== state.selectedRoom) {
      this.lastSelected = state.selectedRoom;
      dynamicChanged = true;
    }
    if (state.animatingRooms.size !== this.lastAnimCount) {
      this.lastAnimCount = state.animatingRooms.size;
      dynamicChanged = true;
    }

    const bgNeedsUpdate = this.bgDirty || this.bgDirtyRooms.size > 0;
    const hasAnimation = state.animatingRooms.size > 0;
    const hasSelection = state.selectedRoom !== null;

    if (!bgNeedsUpdate && !dynamicChanged && !hasAnimation && !hasSelection && !this.needsRender) {
      return;
    }

    if (bgNeedsUpdate) {
      this.rebuildBackground();
    }

    const selectionPhase = (now / 500) * 12;
    state.selectionPhase = selectionPhase;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(this.bgCanvas, 0, 0);

    for (const room of this.floorplan.rooms) {
      const anim = state.animatingRooms.get(room.name);
      if (anim) {
        const elapsed = now - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);
        const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const currentStyle: RoomStyleState = {
          wallColor: interpolateColorHSL(anim.fromStyle.wallColor, anim.toStyle.wallColor, easedT),
          floorColor: interpolateColorHSL(anim.fromStyle.floorColor, anim.toStyle.floorColor, easedT),
          furnitureColor: interpolateColorHSL(anim.fromStyle.furnitureColor, anim.toStyle.furnitureColor, easedT),
          styleId: t >= 1 ? anim.toStyle.styleId : anim.fromStyle.styleId
        };

        if (t >= 1) {
          state.roomStyles[room.name] = anim.toStyle;
          state.animatingRooms.delete(room.name);
          this.bgDirtyRooms.add(room.name);
        } else {
          const preset = this.stylePresets.get(currentStyle.styleId);
          if (preset) {
            this.ctx.save();
            drawPolygon(this.ctx, room.polygon);
            this.ctx.clip();
            const bounds = getPolygonBounds(room.polygon);
            this.ctx.clearRect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);
            renderRoomBase(this.ctx, room, currentStyle, preset);
            this.ctx.restore();
          }
        }
      }
    }

    for (const room of this.floorplan.rooms) {
      const isHovered = state.hoveredRoom === room.name;
      const isSelected = state.selectedRoom === room.name;

      if (isHovered && !isSelected) {
        renderRoomHover(this.ctx, room);
      }

      if (isSelected) {
        renderRoomSelection(this.ctx, room, selectionPhase);
      }
    }

    for (const room of this.floorplan.rooms) {
      renderRoomLabel(this.ctx, room);
    }

    this.needsRender = false;
  }

  renderExport(exportCtx: CanvasRenderingContext2D): void {
    const state = this.state;

    exportCtx.fillStyle = '#1a1a2e';
    exportCtx.fillRect(0, 0, exportCtx.canvas.width, exportCtx.canvas.height);

    for (const room of this.floorplan.rooms) {
      const styleState = state.roomStyles[room.name];
      if (!styleState) continue;
      const preset = this.stylePresets.get(styleState.styleId);
      if (!preset) continue;
      renderRoomBase(exportCtx, room, styleState, preset);
      renderRoomLabel(exportCtx, room);
    }
  }

  updateFloorplan(fp: FloorplanData): void {
    this.floorplan = fp;
    this.markAllDirty();
  }
}
