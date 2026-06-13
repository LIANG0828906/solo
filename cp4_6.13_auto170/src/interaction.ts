import { FloorplanData, Point } from './floorplan';
import { StylePreset, getAllStyles } from './styleLibrary';
import { RoomStyleState } from './store';
import { RenderState, AnimationState, Renderer } from './renderer';

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
  for (let i = floorplan.rooms.length - 1; i >= 0; i--) {
    const room = floorplan.rooms[i];
    if (pointInPolygon(x, y, room.polygon)) {
      return room.name;
    }
  }
  return null;
}

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private floorplan: FloorplanData;
  private renderState: RenderState;
  private stylePresets: Map<string, StylePreset>;
  private callbacks: InteractionCallbacks;
  private renderer: Renderer;
  private scaleX: number = 1;
  private scaleY: number = 1;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: Renderer,
    floorplan: FloorplanData,
    renderState: RenderState,
    stylePresets: Map<string, StylePreset>,
    callbacks: InteractionCallbacks
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.floorplan = floorplan;
    this.renderState = renderState;
    this.stylePresets = stylePresets;
    this.callbacks = callbacks;

    this.updateScale();
    this.bindEvents();
  }

  private updateScale(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.scaleX = this.canvas.width / rect.width;
    this.scaleY = this.canvas.height / rect.height;
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * this.scaleX,
      y: (e.clientY - rect.top) * this.scaleY
    };
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const coords = this.getCanvasCoords(e);
      const roomName = findRoomAtPoint(this.floorplan, coords.x, coords.y);

      if (roomName !== this.renderState.hoveredRoom) {
        const prev = this.renderState.hoveredRoom;
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

    window.addEventListener('resize', () => {
      this.updateScale();
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
      this.renderer.markRoomDirty(roomName);
    }
    this.callbacks.onSchemeChange();
  }

  updateFloorplan(floorplan: FloorplanData): void {
    this.floorplan = floorplan;
    this.renderer.updateFloorplan(floorplan);
  }

  getRenderState(): RenderState {
    return this.renderState;
  }

  start(): void {
    this.renderer.start();
  }

  stop(): void {
    this.renderer.stop();
  }
}
