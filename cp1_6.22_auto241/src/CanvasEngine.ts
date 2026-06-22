import {
  Point,
  Wall,
  Door,
  Window,
  Dimension,
  Room,
  Tool,
  PIXELS_PER_METER
} from './types';
import { DimensionCalculator } from './DimensionCalculator';

export interface CanvasEngineOptions {
  canvas: HTMLCanvasElement;
  gridSize?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomSpeed?: number;
}

export interface EngineCallbacks {
  onCanvasClick?: (point: Point, event: MouseEvent) => void;
  onCanvasMouseMove?: (point: Point, event: MouseEvent) => void;
  onCanvasMouseDown?: (point: Point, event: MouseEvent) => void;
  onCanvasMouseUp?: (point: Point, event: MouseEvent) => void;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: Point) => void;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridSize: number;
  private minZoom: number;
  private maxZoom: number;
  private zoomSpeed: number;

  private zoom: number = 1;
  private pan: Point = { x: 0, y: 0 };
  private targetZoom: number = 1;
  private animationFrameId: number | null = null;
  private zoomStartTime: number = 0;
  private zoomStartValue: number = 1;
  private zoomDuration: number = 200;

  private isDragging: boolean = false;
  private isSpacePressed: boolean = false;
  private lastMousePos: Point = { x: 0, y: 0 };
  private dragStart: Point = { x: 0, y: 0 };
  private panStart: Point = { x: 0, y: 0 };

  private callbacks: EngineCallbacks = {};

  private walls: Wall[] = [];
  private doors: Door[] = [];
  private windows: Window[] = [];
  private dimensions: Dimension[] = [];
  private rooms: Room[] = [];
  private selectedElementId: string | null = null;
  private selectedElementType: 'wall' | 'door' | 'window' | null = null;
  private currentTool: Tool = 'select';
  private drawingPoints: Point[] = [];
  private isDrawing: boolean = false;
  private mousePosition: Point = { x: 0, y: 0 };

  private backgroundColor = '#F8F9FA';
  private wallColor = '#4A5568';
  private selectedColor = '#3182CE';
  private dimensionColor = '#718096';
  private previewColor = '#E53E3E';

  constructor(options: CanvasEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;
    this.gridSize = options.gridSize || PIXELS_PER_METER;
    this.minZoom = options.minZoom || 0.5;
    this.maxZoom = options.maxZoom || 3;
    this.zoomSpeed = options.zoomSpeed || 0.1;

    this.setupEventListeners();
    this.resize();
    this.render();
  }

  setCallbacks(callbacks: EngineCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.resize);
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.resize);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.render();
  };

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const point = this.screenToWorld(screenX, screenY);

    this.lastMousePos = { x: screenX, y: screenY };
    this.dragStart = { x: screenX, y: screenY };
    this.panStart = { ...this.pan };

    if (this.isSpacePressed || e.button === 1) {
      this.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.callbacks.onCanvasMouseDown?.(point, e);
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const point = this.screenToWorld(screenX, screenY);

    this.mousePosition = point;

    if (this.isDragging) {
      const dx = screenX - this.dragStart.x;
      const dy = screenY - this.dragStart.y;
      this.pan = {
        x: this.panStart.x + dx,
        y: this.panStart.y + dy
      };
      this.callbacks.onPanChange?.(this.pan);
      this.render();
    } else {
      this.callbacks.onCanvasMouseMove?.(point, e);
    }

    this.lastMousePos = { x: screenX, y: screenY };
  };

  private handleMouseUp = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const point = this.screenToWorld(screenX, screenY);

    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = this.isSpacePressed ? 'grab' : 'default';
    } else {
      this.callbacks.onCanvasClick?.(point, e);
      this.callbacks.onCanvasMouseUp?.(point, e);
    }
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldBefore = this.screenToWorld(mouseX, mouseY);

    const delta = e.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed;
    this.targetZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.zoom + delta * this.zoom)
    );

    this.zoomStartValue = this.zoom;
    this.zoomStartTime = performance.now();
    this.startZoomAnimation(mouseX, mouseY, worldBefore);
  };

  private startZoomAnimation(mouseX: number, mouseY: number, worldBefore: Point) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.zoomStartTime;
      const progress = Math.min(elapsed / this.zoomDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.zoom = this.zoomStartValue + (this.targetZoom - this.zoomStartValue) * easeProgress;

      const scale = this.zoom / this.zoomStartValue;
      this.pan.x = mouseX - (worldBefore.x * this.zoom + this.pan.x - mouseX) / scale * scale;
      this.pan.y = mouseY - (worldBefore.y * this.zoom + this.pan.y - mouseY) / scale * scale;

      const worldAfter = this.screenToWorld(mouseX, mouseY);
      this.pan.x += (worldBefore.x - worldAfter.x) * this.zoom;
      this.pan.y += (worldBefore.y - worldAfter.y) * this.zoom;

      this.callbacks.onZoomChange?.(this.zoom);
      this.callbacks.onPanChange?.(this.pan);
      this.render();

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !this.isSpacePressed) {
      this.isSpacePressed = true;
      if (!this.isDragging) {
        this.canvas.style.cursor = 'grab';
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.isSpacePressed = false;
      if (!this.isDragging) {
        this.canvas.style.cursor = 'default';
      }
    }
  };

  screenToWorld(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.pan.x) / this.zoom,
      y: (screenY - this.pan.y) / this.zoom
    };
  }

  worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: worldX * this.zoom + this.pan.x,
      y: worldY * this.zoom + this.pan.y
    };
  }

  snapToGrid(point: Point): Point {
    return DimensionCalculator.snapToGrid(point, this.gridSize);
  }

  setWalls(walls: Wall[]) {
    this.walls = walls;
  }

  setDoors(doors: Door[]) {
    this.doors = doors;
  }

  setWindows(windows: Window[]) {
    this.windows = windows;
  }

  setDimensions(dimensions: Dimension[]) {
    this.dimensions = dimensions;
  }

  setRooms(rooms: Room[]) {
    this.rooms = rooms;
  }

  setSelectedElement(id: string | null, type: 'wall' | 'door' | 'window' | null) {
    this.selectedElementId = id;
    this.selectedElementType = type;
  }

  setCurrentTool(tool: Tool) {
    this.currentTool = tool;
  }

  setDrawingState(isDrawing: boolean, points: Point[]) {
    this.isDrawing = isDrawing;
    this.drawingPoints = points;
  }

  setZoom(zoom: number) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.targetZoom = this.zoom;
  }

  setPan(pan: Point) {
    this.pan = pan;
  }

  getZoom(): number {
    return this.zoom;
  }

  getPan(): Point {
    return { ...this.pan };
  }

  getMousePosition(): Point {
    return { ...this.mousePosition };
  }

  render = () => {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(this.pan.x, this.pan.y);
    ctx.scale(this.zoom, this.zoom);

    this.drawGrid();
    this.drawRoomFills();
    this.drawWalls();
    this.drawDoors();
    this.drawWindows();
    this.drawDimensions();
    this.drawSelection();
    this.drawPreview();

    ctx.restore();
  };

  private drawGrid() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();

    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(rect.width, rect.height);

    const startX = Math.floor(topLeft.x / this.gridSize) * this.gridSize;
    const startY = Math.floor(topLeft.y / this.gridSize) * this.gridSize;
    const endX = Math.ceil(bottomRight.x / this.gridSize) * this.gridSize;
    const endY = Math.ceil(bottomRight.y / this.gridSize) * this.gridSize;

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1 / this.zoom;

    for (let x = startX; x <= endX; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  private drawRoomFills() {
    const ctx = this.ctx;
    for (const room of this.rooms) {
      if (room.points.length < 3) continue;
      ctx.fillStyle = 'rgba(203, 213, 225, 0.15)';
      ctx.beginPath();
      ctx.moveTo(room.points[0].x, room.points[0].y);
      for (let i = 1; i < room.points.length; i++) {
        ctx.lineTo(room.points[i].x, room.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawWalls() {
    const ctx = this.ctx;

    for (const wall of this.walls) {
      const isSelected = this.selectedElementId === wall.id && this.selectedElementType === 'wall';
      
      ctx.strokeStyle = isSelected ? this.selectedColor : wall.color;
      ctx.lineWidth = wall.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
    }
  }

  private drawDoors() {
    const ctx = this.ctx;

    for (const door of this.doors) {
      const wall = this.walls.find(w => w.id === door.wallId);
      if (!wall) continue;

      const isSelected = this.selectedElementId === door.id && this.selectedElementType === 'door';
      const center = DimensionCalculator.getPointAlongWall(wall, door.position);
      const dir = DimensionCalculator.getWallDirection(wall);
      const perp = DimensionCalculator.getWallPerpendicular(wall);

      const halfWidth = door.width / 2;
      const doorStart = {
        x: center.x - dir.x * halfWidth,
        y: center.y - dir.y * halfWidth
      };

      ctx.save();
      ctx.translate(doorStart.x, doorStart.y);

      const angle = Math.atan2(dir.y, dir.x);
      ctx.rotate(angle);

      ctx.fillStyle = door.color;
      ctx.strokeStyle = isSelected ? this.selectedColor : '#2D3748';
      ctx.lineWidth = isSelected ? 2 : 1;

      const swingRad = (door.swingAngle * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(door.width, 0);
      ctx.lineTo(door.width * Math.cos(swingRad), -door.width * Math.sin(swingRad));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(0, 0, door.width, -swingRad, 0);
      ctx.strokeStyle = isSelected ? this.selectedColor : '#A0AEC0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }
  }

  private drawWindows() {
    const ctx = this.ctx;

    for (const win of this.windows) {
      const wall = this.walls.find(w => w.id === win.wallId);
      if (!wall) continue;

      const isSelected = this.selectedElementId === win.id && this.selectedElementType === 'window';
      const center = DimensionCalculator.getPointAlongWall(wall, win.position);
      const dir = DimensionCalculator.getWallDirection(wall);

      const halfWidth = win.width / 2;
      const start = {
        x: center.x - dir.x * halfWidth,
        y: center.y - dir.y * halfWidth
      };
      const end = {
        x: center.x + dir.x * halfWidth,
        y: center.y + dir.y * halfWidth
      };

      ctx.strokeStyle = isSelected ? this.selectedColor : '#2D3748';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.strokeStyle = win.color;
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const perp = DimensionCalculator.getWallPerpendicular(wall);
      const glassOffset = 2;

      ctx.strokeStyle = '#90CDF4';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(start.x + perp.x * glassOffset, start.y + perp.y * glassOffset);
      ctx.lineTo(end.x + perp.x * glassOffset, end.y + perp.y * glassOffset);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(start.x - perp.x * glassOffset, start.y - perp.y * glassOffset);
      ctx.lineTo(end.x - perp.x * glassOffset, end.y - perp.y * glassOffset);
      ctx.stroke();
    }
  }

  private drawDimensions() {
    const ctx = this.ctx;

    for (const dim of this.dimensions) {
      ctx.strokeStyle = this.dimensionColor;
      ctx.fillStyle = this.dimensionColor;
      ctx.lineWidth = 1 / this.zoom;

      ctx.beginPath();
      ctx.moveTo(dim.startPoint.x, dim.startPoint.y);
      ctx.lineTo(dim.endPoint.x, dim.endPoint.y);
      ctx.stroke();

      const dx = dim.endPoint.x - dim.startPoint.x;
      const dy = dim.endPoint.y - dim.startPoint.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      const perpX = -dy / len;
      const perpY = dx / len;
      const tickLen = 6;

      ctx.beginPath();
      ctx.moveTo(
        dim.startPoint.x - perpX * tickLen / 2,
        dim.startPoint.y - perpY * tickLen / 2
      );
      ctx.lineTo(
        dim.startPoint.x + perpX * tickLen / 2,
        dim.startPoint.y + perpY * tickLen / 2
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(
        dim.endPoint.x - perpX * tickLen / 2,
        dim.endPoint.y - perpY * tickLen / 2
      );
      ctx.lineTo(
        dim.endPoint.x + perpX * tickLen / 2,
        dim.endPoint.y + perpY * tickLen / 2
      );
      ctx.stroke();

      ctx.save();
      ctx.font = `${12 / this.zoom}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        angle += Math.PI;
      }

      ctx.translate(dim.textPosition.x, dim.textPosition.y);
      ctx.rotate(angle);
      ctx.fillText(dim.text, 0, 0);
      ctx.restore();
    }
  }

  private drawSelection() {
    const ctx = this.ctx;

    if (!this.selectedElementId || !this.selectedElementType) return;

    if (this.selectedElementType === 'door') {
      const door = this.doors.find(d => d.id === this.selectedElementId);
      if (!door) return;
      const wall = this.walls.find(w => w.id === door.wallId);
      if (!wall) return;

      const center = DimensionCalculator.getPointAlongWall(wall, door.position);
      
      ctx.strokeStyle = this.selectedColor;
      ctx.lineWidth = 2 / this.zoom;
      ctx.setLineDash([4, 4]);
      
      const radius = door.width * 0.8;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.selectedElementType === 'window') {
      const win = this.windows.find(w => w.id === this.selectedElementId);
      if (!win) return;
      const wall = this.walls.find(w => w.id === win.wallId);
      if (!wall) return;

      const center = DimensionCalculator.getPointAlongWall(wall, win.position);
      
      ctx.strokeStyle = this.selectedColor;
      ctx.lineWidth = 2 / this.zoom;
      ctx.setLineDash([4, 4]);
      
      const radius = win.width * 0.6;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawPreview() {
    const ctx = this.ctx;

    if (!this.isDrawing || this.drawingPoints.length === 0) return;

    ctx.strokeStyle = this.previewColor;
    ctx.lineWidth = 2 / this.zoom;
    ctx.setLineDash([8, 6]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.drawingPoints[0].x, this.drawingPoints[0].y);
    for (let i = 1; i < this.drawingPoints.length; i++) {
      ctx.lineTo(this.drawingPoints[i].x, this.drawingPoints[i].y);
    }

    if (this.currentTool === 'room' && this.drawingPoints.length < 4) {
      const snappedMouse = this.snapToGrid(this.mousePosition);
      ctx.lineTo(snappedMouse.x, snappedMouse.y);
    }

    if (this.currentTool === 'room' && this.drawingPoints.length === 4) {
      ctx.closePath();
    }

    ctx.stroke();
    ctx.setLineDash([]);

    for (const point of this.drawingPoints) {
      ctx.fillStyle = this.previewColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4 / this.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  findWallAtPoint(point: Point, threshold: number = 10): Wall | null {
    let closestWall: Wall | null = null;
    let closestDist = threshold / this.zoom;

    for (const wall of this.walls) {
      const dist = DimensionCalculator.distanceToPoint(wall, point);
      if (dist < closestDist) {
        closestDist = dist;
        closestWall = wall;
      }
    }

    return closestWall;
  }

  findDoorAtPoint(point: Point, threshold: number = 15): Door | null {
    let closestDoor: Door | null = null;
    let closestDist = threshold / this.zoom;

    for (const door of this.doors) {
      const wall = this.walls.find(w => w.id === door.wallId);
      if (!wall) continue;

      const center = DimensionCalculator.getPointAlongWall(wall, door.position);
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < door.width * 0.8 && dist < closestDist) {
        closestDist = dist;
        closestDoor = door;
      }
    }

    return closestDoor;
  }

  findWindowAtPoint(point: Point, threshold: number = 15): Window | null {
    let closestWindow: Window | null = null;
    let closestDist = threshold / this.zoom;

    for (const win of this.windows) {
      const wall = this.walls.find(w => w.id === win.wallId);
      if (!wall) continue;

      const center = DimensionCalculator.getPointAlongWall(wall, win.position);
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < win.width * 0.6 && dist < closestDist) {
        closestDist = dist;
        closestWindow = win;
      }
    }

    return closestWindow;
  }
}
