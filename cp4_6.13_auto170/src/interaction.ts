import { FloorplanData, Point } from './floorplan';
import { StylePreset, getAllStyles, interpolateColorHSL } from './styleLibrary';
import { RoomStyleState } from './store';
import { RenderState, AnimationState, renderFrame } from './renderer';

export interface InteractionCallbacks {
  onRoomHover: (roomName: string | null) => void;
  onRoomSelect: (roomName: string | null) => void;
  onStyleChange: (roomName: string, styleId: string) => void;
  onSchemeChange: () => void;
}

function pointInPolygon(px: number, py: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function findRoomAtPoint(
  floorplan: FloorplanData,
  x: number,
  y: number
): string | null {
  for (const room of floorplan.rooms) {
    if (pointInPolygon(x, y, room.polygon)) {
      return room.name;
    }
  }
  return null;
}

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floorplan: FloorplanData;
  private renderState: RenderState;
  private stylePresets: Map<string, StylePreset>;
  private callbacks: InteractionCallbacks;
  private animFrameId: number = 0;
  private scaleRatio: number = 1;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    floorplan: FloorplanData,
    renderState: RenderState,
    stylePresets: Map<string, StylePreset>,
    callbacks: InteractionCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.floorplan = floorplan;
    this.renderState = renderState;
    this.stylePresets = stylePresets;
    this.callbacks = callbacks;

    this.bindEvents();
    this.startRenderLoop();
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.scaleRatio = scaleX;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const coords = this.getCanvasCoords(e);
      const roomName = findRoomAtPoint(this.floorplan, coords.x, coords.y);

      if (roomName !== this.renderState.hoveredRoom) {
        this.renderState.hoveredRoom = roomName;
        this.callbacks.onRoomHover(roomName);
      }
    });

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      const coords = this.getCanvasCoords(e);
      const roomName = findRoomAtPoint(this.floorplan, coords.x, coords.y);

      this.renderState.selectedRoom = roomName;
      this.callbacks.onRoomSelect(roomName);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.renderState.hoveredRoom = null;
      this.callbacks.onRoomHover(null);
    });
  }

  applyStyleToRoom(roomName: string, styleId: string): void {
    const currentStyle = this.renderState.roomStyles[roomName];
    if (!currentStyle) return;
    if (currentStyle.styleId === styleId) return;

    const newPreset = this.stylePresets.get(styleId);
    if (!newPreset) return;

    const fromStyle: RoomStyleState = { ...currentStyle };
    const toStyle: RoomStyleState = {
      wallColor: newPreset.wallColor,
      floorColor: newPreset.floorColor,
      furnitureColor: newPreset.furnitureColor,
      styleId
    };

    const animState: AnimationState = {
      fromStyle,
      toStyle,
      startTime: performance.now(),
      duration: 400
    };

    this.renderState.animatingRooms.set(roomName, animState);
    this.callbacks.onStyleChange(roomName, styleId);
  }

  applyStyleToAllRooms(styleId: string): void {
    for (const room of this.floorplan.rooms) {
      this.applyStyleToRoom(room.name, styleId);
    }
  }

  loadRoomStyles(roomStyles: Record<string, RoomStyleState>): void {
    for (const [roomName, style] of Object.entries(roomStyles)) {
      this.renderState.roomStyles[roomName] = { ...style };
      this.renderState.animatingRooms.delete(roomName);
    }
    this.callbacks.onSchemeChange();
  }

  private startRenderLoop(): void {
    const loop = (now: number) => {
      renderFrame(
        this.ctx,
        this.floorplan,
        this.renderState,
        this.stylePresets,
        now
      );
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  updateFloorplan(floorplan: FloorplanData): void {
    this.floorplan = floorplan;
  }

  getRenderState(): RenderState {
    return this.renderState;
  }
}
