import type {
  BoardElement,
  BrushStroke,
  StickyNote,
  ConnectionLine,
  Point,
  ToolType,
  BrushSize,
  BrushColor,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const BRUSH_COLORS: BrushColor[] = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A29BFE'];
const BRUSH_SIZES: BrushSize[] = [1, 3, 5, 8];
const CANVAS_WIDTH = 10000;
const CANVAS_HEIGHT = 6000;
const BG_COLOR = '#F8F8F2';
const GRID_COLOR = '#E0E0E0';
const GRID_SIZE = 50;

export interface BoardState {
  elements: BoardElement[];
  zoom: number;
  offsetX: number;
  offsetY: number;
  currentTool: ToolType;
  brushColor: BrushColor;
  brushSize: BrushSize;
}

type StateChangeListener = (state: BoardState) => void;
type ActionListener = (action: string, payload?: any) => void;

export class BoardEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private state: BoardState = {
    elements: [],
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    currentTool: 'none',
    brushColor: '#6C5CE7',
    brushSize: 3,
  };
  private isRightDragging = false;
  private isDrawing = false;
  private isDraggingSticky = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private currentStroke: BrushStroke | null = null;
  private selectedStickyId: string | null = null;
  private connectionStartId: string | null = null;
  private stateChangeListeners: StateChangeListener[] = [];
  private actionListeners: ActionListener[] = [];
  private highlightAdded: string[] = [];
  private highlightRemoved: string[] = [];
  private animFrameId: number | null = null;
  private pulseTime = 0;

  constructor() {}

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.resize();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    this.state.offsetX = cx - (CANVAS_WIDTH / 2) * this.state.zoom;
    this.state.offsetY = cy - (CANVAS_HEIGHT / 2) * this.state.zoom;
    this.bindEvents();
    this.startRenderLoop();
    this.setState({ elements: this.state.elements });
  }

  destroy() {
    this.unbindEvents();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  onStateChange(listener: StateChangeListener) {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  onAction(listener: ActionListener) {
    this.actionListeners.push(listener);
    return () => {
      this.actionListeners = this.actionListeners.filter(l => l !== listener);
    };
  }

  private emitAction(action: string, payload?: any) {
    this.actionListeners.forEach(l => l(action, payload));
  }

  private emitStateChange() {
    this.stateChangeListeners.forEach(l => l({ ...this.state }));
  }

  setState(partial: Partial<BoardState>) {
    this.state = { ...this.state, ...partial };
    this.emitStateChange();
  }

  getState(): BoardState {
    return { ...this.state };
  }

  setElements(elements: BoardElement[], highlight?: { added: string[]; removed: string[] }) {
    this.state.elements = elements;
    if (highlight) {
      this.highlightAdded = highlight.added;
      this.highlightRemoved = highlight.removed;
      this.pulseTime = Date.now();
      setTimeout(() => {
        this.highlightAdded = [];
        this.highlightRemoved = [];
      }, 1500);
    }
    this.emitStateChange();
  }

  setTool(tool: ToolType) {
    this.state.currentTool = tool;
    this.connectionStartId = null;
    this.emitStateChange();
  }

  setBrushColor(color: BrushColor) {
    this.state.brushColor = color;
    this.emitStateChange();
  }

  setBrushSize(size: BrushSize) {
    this.state.brushSize = size;
    this.emitStateChange();
  }

  setZoom(zoom: number) {
    this.state.zoom = Math.max(0.1, Math.min(5, zoom));
    this.emitStateChange();
  }

  setOffset(x: number, y: number) {
    this.state.offsetX = x;
    this.state.offsetY = y;
    this.emitStateChange();
  }

  addStickyNoteAtCenter() {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const sticky: StickyNote = {
      id: uuidv4(),
      type: 'sticky',
      x: centerX - 150,
      y: centerY - 125,
      width: 300,
      height: 250,
      text: '',
      color: '#FFF9C4',
    };
    this.state.elements.push(sticky);
    this.emitAction('add', sticky);
    this.emitStateChange();
  }

  deleteElement(id: string) {
    const idx = this.state.elements.findIndex(e => e.id === id);
    if (idx >= 0) {
      const el = this.state.elements[idx];
      this.state.elements.splice(idx, 1);
      if (el.type === 'sticky') {
        this.state.elements = this.state.elements.filter(
          e => !(e.type === 'line' && (e.fromStickyId === id || e.toStickyId === id))
        );
      }
      this.emitAction('remove', { elementId: id });
      this.emitStateChange();
    }
  }

  updateStickyText(id: string, text: string) {
    const el = this.state.elements.find(e => e.id === id) as StickyNote | undefined;
    if (el && el.type === 'sticky') {
      el.text = text;
      this.emitAction('update', { elementId: id, delta: { text } });
      this.emitStateChange();
    }
  }

  private resize = () => {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  private screenToWorld(sx: number, sy: number): Point {
    return {
      x: (sx - this.state.offsetX) / this.state.zoom,
      y: (sy - this.state.offsetY) / this.state.zoom,
    };
  }

  private bindEvents() {
    if (!this.canvas) return;
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private unbindEvents() {
    if (!this.canvas) return;
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onMouseDown = (e: MouseEvent) => {
    const rect = this.canvas!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = this.screenToWorld(sx, sy);

    if (e.button === 2) {
      this.isRightDragging = true;
      this.dragStartX = sx;
      this.dragStartY = sy;
      return;
    }

    if (e.button !== 0) return;

    if (this.state.currentTool === 'brush') {
      this.isDrawing = true;
      this.currentStroke = {
        id: uuidv4(),
        type: 'brush',
        points: [{ x: world.x, y: world.y }],
        color: this.state.brushColor,
        size: this.state.brushSize,
      };
      return;
    }

    const sticky = this.hitTestSticky(world.x, world.y);
    if (sticky) {
      if (this.isDeleteHandle(sx, sy, sticky)) {
        this.deleteElement(sticky.id);
        return;
      }
      if (this.state.currentTool === 'line') {
        if (!this.connectionStartId) {
          this.connectionStartId = sticky.id;
        } else if (this.connectionStartId !== sticky.id) {
          const line: ConnectionLine = {
            id: uuidv4(),
            type: 'line',
            fromStickyId: this.connectionStartId,
            toStickyId: sticky.id,
          };
          this.state.elements.push(line);
          this.emitAction('add', line);
          this.connectionStartId = null;
          this.emitStateChange();
        }
        return;
      }
      if (this.state.currentTool === 'none') {
        this.isDraggingSticky = true;
        this.selectedStickyId = sticky.id;
        this.dragOffsetX = world.x - sticky.x;
        this.dragOffsetY = world.y - sticky.y;
      }
      return;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = this.screenToWorld(sx, sy);

    this.emitAction('activity');

    if (this.isRightDragging) {
      const dx = sx - this.dragStartX;
      const dy = sy - this.dragStartY;
      this.state.offsetX += dx;
      this.state.offsetY += dy;
      this.dragStartX = sx;
      this.dragStartY = sy;
      this.emitStateChange();
      return;
    }

    if (this.isDrawing && this.currentStroke) {
      const last = this.currentStroke.points[this.currentStroke.points.length - 1];
      const dist = Math.hypot(world.x - last.x, world.y - last.y);
      if (dist > 0.5) {
        this.currentStroke.points.push({ x: world.x, y: world.y });
      }
      return;
    }

    if (this.isDraggingSticky && this.selectedStickyId) {
      const el = this.state.elements.find(e => e.id === this.selectedStickyId) as StickyNote | undefined;
      if (el) {
        const oldX = el.x;
        const oldY = el.y;
        el.x = world.x - this.dragOffsetX;
        el.y = world.y - this.dragOffsetY;
        if (oldX !== el.x || oldY !== el.y) {
          this.emitAction('move', { elementId: el.id, delta: { x: el.x, y: el.y } });
        }
        this.emitStateChange();
      }
    }
  };

  private onMouseUp = () => {
    if (this.isRightDragging) {
      this.isRightDragging = false;
      return;
    }
    if (this.isDrawing && this.currentStroke) {
      if (this.currentStroke.points.length > 1) {
        this.state.elements.push(this.currentStroke);
        this.emitAction('add', this.currentStroke);
        this.emitStateChange();
      }
      this.currentStroke = null;
      this.isDrawing = false;
      return;
    }
    if (this.isDraggingSticky) {
      this.isDraggingSticky = false;
      this.selectedStickyId = null;
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const oldZoom = this.state.zoom;
    const newZoom = Math.max(0.1, Math.min(5, oldZoom * (1 + delta)));
    const rect = this.canvas!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const ratio = newZoom / oldZoom;
    this.state.offsetX = sx - (sx - this.state.offsetX) * ratio;
    this.state.offsetY = sy - (sy - this.state.offsetY) * ratio;
    this.state.zoom = newZoom;
    this.emitStateChange();
  };

  private hitTestSticky(x: number, y: number): StickyNote | null {
    for (let i = this.state.elements.length - 1; i >= 0; i--) {
      const el = this.state.elements[i];
      if (el.type === 'sticky') {
        if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
          return el;
        }
      }
    }
    return null;
  }

  private isDeleteHandle(sx: number, sy: number, sticky: StickyNote): boolean {
    const handleSize = 20 * this.state.zoom;
    const world = this.screenToWorld(sx, sy);
    const handleWorldSize = handleSize / this.state.zoom;
    const handleX = sticky.x + sticky.width - handleWorldSize;
    const handleY = sticky.y;
    return (
      world.x >= handleX &&
      world.x <= sticky.x + sticky.width &&
      world.y >= handleY &&
      world.y <= handleY + handleWorldSize
    );
  }

  private getScaledFontSize(baseSize: number): number {
    const scaled = baseSize * this.state.zoom;
    if (scaled < 12) return 12 / this.state.zoom;
    if (scaled > 48) return 48 / this.state.zoom;
    return baseSize;
  }

  private startRenderLoop = () => {
    const render = () => {
      this.render();
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  };

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.save();
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.translate(this.state.offsetX, this.state.offsetY);
    ctx.scale(this.state.zoom, this.state.zoom);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.clip();

    if (this.state.zoom < 2) {
      this.drawGrid(ctx);
    }

    this.drawConnections(ctx);
    this.drawBrushes(ctx);
    this.drawStickies(ctx);

    if (this.currentStroke) {
      this.drawBrushStroke(ctx, this.currentStroke);
    }

    if (this.connectionStartId) {
      this.drawConnectionHint(ctx);
    }

    ctx.restore();
    ctx.restore();

    this.drawHighlights();
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1 / this.state.zoom;
    ctx.beginPath();
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();
  }

  private drawBrushes(ctx: CanvasRenderingContext2D) {
    this.state.elements.forEach(el => {
      if (el.type === 'brush') {
        if (this.highlightRemoved.includes(el.id)) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          this.drawBrushStroke(ctx, el);
          ctx.restore();
        } else {
          this.drawBrushStroke(ctx, el);
        }
      }
    });
  }

  private drawBrushStroke(ctx: CanvasRenderingContext2D, stroke: BrushStroke) {
    if (stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }

  private drawStickies(ctx: CanvasRenderingContext2D) {
    this.state.elements.forEach(el => {
      if (el.type === 'sticky') {
        if (this.highlightRemoved.includes(el.id)) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          this.drawStickyNote(ctx, el);
          ctx.restore();
        } else {
          this.drawStickyNote(ctx, el);
        }
      }
    });
  }

  private drawStickyNote(ctx: CanvasRenderingContext2D, sticky: StickyNote) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 6 / this.state.zoom;
    ctx.shadowOffsetX = 2 / this.state.zoom;
    ctx.shadowOffsetY = 4 / this.state.zoom;

    const r = 8;
    const x = sticky.x;
    const y = sticky.y;
    const w = sticky.width;
    const h = sticky.height;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = sticky.color;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#E6DB74';
    ctx.lineWidth = 1 / this.state.zoom;
    ctx.stroke();
    ctx.restore();

    const handleSize = 20;
    ctx.fillStyle = '#6C5CE7';
    ctx.beginPath();
    ctx.arc(x + w - handleSize / 2, y + handleSize / 2, handleSize / 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold ' + (14 / this.state.zoom) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', x + w - handleSize / 2, y + handleSize / 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 12, y + handleSize, w - 24, h - handleSize - 12);
    ctx.clip();
    ctx.fillStyle = '#2D2D44';
    const fontSize = this.getScaledFontSize(16);
    ctx.font = fontSize + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = this.wrapText(ctx, sticky.text || '双击编辑便签', w - 24);
    let ty = y + handleSize + 4;
    for (const line of lines) {
      ctx.fillText(line, x + 12, ty);
      ty += fontSize * 1.4;
      if (ty > y + h - 12) break;
    }
    ctx.restore();

    if (this.connectionStartId === sticky.id) {
      ctx.strokeStyle = '#6C5CE7';
      ctx.lineWidth = 3 / this.state.zoom;
      ctx.setLineDash([6 / this.state.zoom, 4 / this.state.zoom]);
      ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
      ctx.setLineDash([]);
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let current = '';
    for (const char of text) {
      const test = current + char;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    if (lines.length === 0) lines.push('');
    return lines;
  }

  private drawConnections(ctx: CanvasRenderingContext2D) {
    const stickies = new Map<string, StickyNote>();
    this.state.elements.forEach(el => {
      if (el.type === 'sticky') stickies.set(el.id, el);
    });

    this.state.elements.forEach(el => {
      if (el.type === 'line') {
        const from = stickies.get(el.fromStickyId);
        const to = stickies.get(el.toStickyId);
        if (!from || !to) return;

        const isRemoved = this.highlightRemoved.includes(el.id);
        const isAdded = this.highlightAdded.includes(el.id);

        if (isRemoved) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          this.drawBezierLine(ctx, from, to, '#B2B2D0');
          ctx.restore();
        } else if (isAdded) {
          const t = (Date.now() - this.pulseTime) / 500;
          const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = (2 + pulse * 3) / this.state.zoom;
          this.drawBezierLine(ctx, from, to, '#FF6B6B');
        } else {
          this.drawBezierLine(ctx, from, to, '#B2B2D0');
        }
      }
    });
  }

  private drawBezierLine(ctx: CanvasRenderingContext2D, from: StickyNote, to: StickyNote, color: string) {
    const x1 = from.x + from.width / 2;
    const y1 = from.y + from.height / 2;
    const x2 = to.x + to.width / 2;
    const y2 = to.y + to.height / 2;
    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.4;
    const cx2 = x1 + dx * 0.6;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / this.state.zoom;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx1, y1, cx2, y2, x2, y2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x1, y1, 4 / this.state.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, 4 / this.state.zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawConnectionHint(ctx: CanvasRenderingContext2D) {
    if (!this.connectionStartId) return;
    const sticky = this.state.elements.find(e => e.id === this.connectionStartId) as StickyNote | undefined;
    if (!sticky) return;
    ctx.fillStyle = '#6C5CE7';
    ctx.font = this.getScaledFontSize(14) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择目标便签完成连线', sticky.x + sticky.width / 2, sticky.y - 20);
  }

  private drawHighlights() {
    if (!this.ctx || this.highlightAdded.length === 0 || Date.now() - this.pulseTime > 1500) return;
    const ctx = this.ctx;
    const t = (Date.now() - this.pulseTime) / 500;
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
    ctx.save();
    ctx.translate(this.state.offsetX, this.state.offsetY);
    ctx.scale(this.state.zoom, this.state.zoom);
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = (2 + pulse * 3) / this.state.zoom;
    ctx.globalAlpha = pulse;

    this.state.elements.forEach(el => {
      if (!this.highlightAdded.includes(el.id)) return;
      if (el.type === 'sticky') {
        ctx.strokeRect(el.x - 6, el.y - 6, el.width + 12, el.height + 12);
      } else if (el.type === 'brush' && el.points.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        el.points.forEach(p => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
        ctx.strokeRect(minX - 6, minY - 6, maxX - minX + 12, maxY - minY + 12);
      }
    });
    ctx.restore();
  }
}

export const boardEngine = new BoardEngine();
