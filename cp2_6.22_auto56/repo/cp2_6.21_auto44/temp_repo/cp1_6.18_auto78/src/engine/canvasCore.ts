import { v4 as uuidv4 } from 'uuid';
import {
  WhiteboardElement,
  PathElement,
  RectangleElement,
  CircleElement,
  PolygonElement,
  TextElement,
  ImageElement,
  ToolType,
  MAX_IMAGE_DISPLAY_WIDTH,
  MAX_IMAGE_SIZE,
} from '@types/index';
import { useElementStore } from '@data/elementStore';
import { syncScheduler } from '@scheduler/syncScheduler';

export type DragMode =
  | 'none'
  | 'draw'
  | 'move'
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br';

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  tempPoints: { x: number; y: number }[];
  dragMode: DragMode;
  targetElementId: string | null;
  moveOffsetX: number;
  moveOffsetY: number;
  originalElement: WhiteboardElement | null;
}

type TextInputCallback = (x: number, y: number, content: string) => void;

export class CanvasCore {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private state: DrawingState;
  private lastRenderTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private textInputCallback: TextInputCallback | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    const offCtx = this.offscreenCanvas.getContext('2d');
    if (!offCtx) throw new Error('Offscreen canvas context not available');
    this.offscreenCtx = offCtx;

    this.state = {
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      tempPoints: [],
      dragMode: 'none',
      targetElementId: null,
      moveOffsetX: 0,
      moveOffsetY: 0,
      originalElement: null,
    };

    this.bindEvents();
    this.resize();
    this.startRenderLoop();
  }

  setTextInputCallback(cb: TextInputCallback): void {
    this.textInputCallback = cb;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.offscreenCanvas.width = rect.width * dpr;
    this.offscreenCanvas.height = rect.height * dpr;
    this.offscreenCtx.scale(dpr, dpr);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
    window.addEventListener('resize', this.handleResize);
  }

  destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = () => this.resize();

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private handleMouseDown = (e: MouseEvent) => {
    const store = useElementStore.getState();
    if (store.replay.isPlaying) return;

    const { x, y } = this.getCanvasCoords(e);
    const tool = store.tool;

    const hit = this.hitTest(x, y);
    if (tool === 'select' && hit) {
      this.state.dragMode = hit.mode;
      this.state.targetElementId = hit.elementId;
      this.state.originalElement = store.elements.find(
        (el) => el.id === hit.elementId,
      ) || null;

      if (hit.mode === 'move' && this.state.originalElement) {
        const el = this.state.originalElement;
        let ex = 0,
          ey = 0;
        if (el.type === 'path') {
          ex = (el as PathElement).points[0]?.x || 0;
          ey = (el as PathElement).points[0]?.y || 0;
        } else if (el.type === 'circle') {
          ex = (el as CircleElement).cx;
          ey = (el as CircleElement).cy;
        } else if (el.type === 'polygon') {
          ex = (el as PolygonElement).cx;
          ey = (el as PolygonElement).cy;
        } else {
          ex = (el as any).x;
          ey = (el as any).y;
        }
        this.state.moveOffsetX = x - ex;
        this.state.moveOffsetY = y - ey;
      }

      useElementStore.getState().setSelectedElementId(hit.elementId);
      this.state.isDrawing = true;
      this.state.startX = x;
      this.state.startY = y;
      this.state.currentX = x;
      this.state.currentY = y;
      return;
    }

    useElementStore.getState().setSelectedElementId(null);

    if (tool === 'text') {
      if (this.textInputCallback) {
        this.textInputCallback(x, y, '');
      }
      return;
    }

    if (tool === 'image') {
      this.triggerImageUpload();
      return;
    }

    if (tool === 'select') return;

    this.state.isDrawing = true;
    this.state.startX = x;
    this.state.startY = y;
    this.state.currentX = x;
    this.state.currentY = y;
    this.state.tempPoints = [{ x, y }];
  };

  private handleMouseMove = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoords(e);
    syncScheduler.sendCursor(x, y);

    if (!this.state.isDrawing) return;

    const tool = useElementStore.getState().tool;
    this.state.currentX = x;
    this.state.currentY = y;

    if (tool === 'brush') {
      this.state.tempPoints.push({ x, y });
    }

    if (tool === 'select' && this.state.targetElementId && this.state.originalElement) {
      this.handleDragUpdate(x, y);
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (!this.state.isDrawing) return;

    const { x, y } = this.getCanvasCoords(e);
    const tool = useElementStore.getState().tool;
    const store = useElementStore.getState();

    if (tool === 'select' && this.state.targetElementId) {
      this.state.isDrawing = false;
      this.state.dragMode = 'none';
      this.state.targetElementId = null;
      this.state.originalElement = null;
      return;
    }

    if (tool === 'brush' && this.state.tempPoints.length > 1) {
      const element: PathElement = {
        id: uuidv4(),
        type: 'path',
        userId: store.currentUserId,
        color: store.currentUserColor,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        points: [...this.state.tempPoints],
        width: store.brushWidth,
      };
      syncScheduler.immediateAdd(element);
    }

    if (tool === 'rectangle') {
      const rx = Math.min(this.state.startX, x);
      const ry = Math.min(this.state.startY, y);
      const rw = Math.abs(x - this.state.startX);
      const rh = Math.abs(y - this.state.startY);
      if (rw > 2 && rh > 2) {
        const element: RectangleElement = {
          id: uuidv4(),
          type: 'rectangle',
          userId: store.currentUserId,
          color: store.currentUserColor,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          x: rx,
          y: ry,
          width: rw,
          height: rh,
          borderRadius: store.borderRadius,
          borderWidth: 2,
        };
        syncScheduler.immediateAdd(element);
      }
    }

    if (tool === 'circle') {
      const cx = (this.state.startX + x) / 2;
      const cy = (this.state.startY + y) / 2;
      const rx = Math.abs(x - this.state.startX) / 2;
      const ry = Math.abs(y - this.state.startY) / 2;
      if (rx > 2 && ry > 2) {
        const element: CircleElement = {
          id: uuidv4(),
          type: 'circle',
          userId: store.currentUserId,
          color: store.currentUserColor,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          cx,
          cy,
          radiusX: rx,
          radiusY: ry,
          borderWidth: 2,
        };
        syncScheduler.immediateAdd(element);
      }
    }

    if (tool === 'polygon') {
      const cx = (this.state.startX + x) / 2;
      const cy = (this.state.startY + y) / 2;
      const radius = Math.max(
        Math.abs(x - this.state.startX) / 2,
        Math.abs(y - this.state.startY) / 2,
      );
      if (radius > 5) {
        const element: PolygonElement = {
          id: uuidv4(),
          type: 'polygon',
          userId: store.currentUserId,
          color: store.currentUserColor,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          cx,
          cy,
          radius,
          sides: store.polygonSides,
          rotation: -Math.PI / 2,
          borderWidth: 2,
        };
        syncScheduler.immediateAdd(element);
      }
    }

    this.state.isDrawing = false;
    this.state.tempPoints = [];
  };

  private handleDragUpdate(x: number, y: number): void {
    if (!this.state.targetElementId || !this.state.originalElement) return;
    const el = this.state.originalElement;
    const id = this.state.targetElementId;

    if (this.state.dragMode === 'move') {
      const newX = x - this.state.moveOffsetX;
      const newY = y - this.state.moveOffsetY;
      let patch: Partial<WhiteboardElement> = {};

      if (el.type === 'path') {
        const first = (el as PathElement).points[0];
        const dx = newX - first.x;
        const dy = newY - first.y;
        patch = {
          points: (el as PathElement).points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        };
      } else if (el.type === 'circle') {
        patch = { cx: newX, cy: newY };
      } else if (el.type === 'polygon') {
        patch = { cx: newX, cy: newY };
      } else {
        patch = { x: newX, y: newY };
      }

      useElementStore.getState().updateElement(id, patch);
      return;
    }

    if (this.state.dragMode.startsWith('resize')) {
      let patch: Partial<WhiteboardElement> = {};

      if (el.type === 'rectangle' || el.type === 'text' || el.type === 'image') {
        const orig = el as RectangleElement;
        let nx = orig.x,
          ny = orig.y,
          nw = orig.width,
          nh = orig.height;

        const dx = x - this.state.startX;
        const dy = y - this.state.startY;

        switch (this.state.dragMode) {
          case 'resize-br':
            nw = Math.max(10, orig.width + dx);
            nh = Math.max(10, orig.height + dy);
            break;
          case 'resize-tr':
            ny = orig.y + dy;
            nw = Math.max(10, orig.width + dx);
            nh = Math.max(10, orig.height - dy);
            if (nh < 10) {
              ny = orig.y + orig.height - 10;
              nh = 10;
            }
            break;
          case 'resize-bl':
            nx = orig.x + dx;
            nw = Math.max(10, orig.width - dx);
            nh = Math.max(10, orig.height + dy);
            if (nw < 10) {
              nx = orig.x + orig.width - 10;
              nw = 10;
            }
            break;
          case 'resize-tl':
            nx = orig.x + dx;
            ny = orig.y + dy;
            nw = Math.max(10, orig.width - dx);
            nh = Math.max(10, orig.height - dy);
            if (nw < 10) {
              nx = orig.x + orig.width - 10;
              nw = 10;
            }
            if (nh < 10) {
              ny = orig.y + orig.height - 10;
              nh = 10;
            }
            break;
        }

        if (el.type === 'image') {
          const ratio = (el as ImageElement).originalWidth / (el as ImageElement).originalHeight;
          if (Math.abs(x - this.state.startX) > Math.abs(y - this.state.startY)) {
            nh = nw / ratio;
          } else {
            nw = nh * ratio;
          }
        }

        patch = { x: nx, y: ny, width: nw, height: nh } as any;
      } else if (el.type === 'circle') {
        const orig = el as CircleElement;
        const dx = x - this.state.startX;
        const dy = y - this.state.startY;
        patch = {
          radiusX: Math.max(5, orig.radiusX + dx),
          radiusY: Math.max(5, orig.radiusY + dy),
        } as any;
      } else if (el.type === 'polygon') {
        const orig = el as PolygonElement;
        const dx = x - this.state.startX;
        const dy = y - this.state.startY;
        patch = {
          radius: Math.max(10, orig.radius + Math.max(Math.abs(dx), Math.abs(dy))),
        } as any;
      }

      useElementStore.getState().updateElement(id, patch);
    }
  }

  private getElementBounds(
    el: WhiteboardElement,
  ): { x: number; y: number; width: number; height: number } {
    switch (el.type) {
      case 'path': {
        const pts = (el as PathElement).points;
        if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        const minx = Math.min(...xs);
        const miny = Math.min(...ys);
        const maxx = Math.max(...xs);
        const maxy = Math.max(...ys);
        return { x: minx, y: miny, width: maxx - minx, height: maxy - miny };
      }
      case 'circle': {
        const c = el as CircleElement;
        return {
          x: c.cx - c.radiusX,
          y: c.cy - c.radiusY,
          width: c.radiusX * 2,
          height: c.radiusY * 2,
        };
      }
      case 'polygon': {
        const p = el as PolygonElement;
        return {
          x: p.cx - p.radius,
          y: p.cy - p.radius,
          width: p.radius * 2,
          height: p.radius * 2,
        };
      }
      case 'rectangle':
      case 'text':
      case 'image':
        return { x: (el as any).x, y: (el as any).y, width: (el as any).width, height: (el as any).height };
    }
  }

  private hitTest(x: number, y: number): { elementId: string; mode: DragMode } | null {
    const store = useElementStore.getState();
    const HANDLE_SIZE = 12;

    for (let i = store.elements.length - 1; i >= 0; i--) {
      const el = store.elements[i];
      const bounds = this.getElementBounds(el);

      if (
        x >= bounds.x - HANDLE_SIZE &&
        x <= bounds.x + bounds.width + HANDLE_SIZE &&
        y >= bounds.y - HANDLE_SIZE &&
        y <= bounds.y + bounds.height + HANDLE_SIZE
      ) {
        const onTL =
          x >= bounds.x - HANDLE_SIZE &&
          x <= bounds.x + HANDLE_SIZE &&
          y >= bounds.y - HANDLE_SIZE &&
          y <= bounds.y + HANDLE_SIZE;
        const onTR =
          x >= bounds.x + bounds.width - HANDLE_SIZE &&
          x <= bounds.x + bounds.width + HANDLE_SIZE &&
          y >= bounds.y - HANDLE_SIZE &&
          y <= bounds.y + HANDLE_SIZE;
        const onBL =
          x >= bounds.x - HANDLE_SIZE &&
          x <= bounds.x + HANDLE_SIZE &&
          y >= bounds.y + bounds.height - HANDLE_SIZE &&
          y <= bounds.y + bounds.height + HANDLE_SIZE;
        const onBR =
          x >= bounds.x + bounds.width - HANDLE_SIZE &&
          x <= bounds.x + bounds.width + HANDLE_SIZE &&
          y >= bounds.y + bounds.height - HANDLE_SIZE &&
          y <= bounds.y + bounds.height + HANDLE_SIZE;

        if (onTL) return { elementId: el.id, mode: 'resize-tl' };
        if (onTR) return { elementId: el.id, mode: 'resize-tr' };
        if (onBL) return { elementId: el.id, mode: 'resize-bl' };
        if (onBR) return { elementId: el.id, mode: 'resize-br' };

        if (
          x >= bounds.x &&
          x <= bounds.x + bounds.width &&
          y >= bounds.y &&
          y <= bounds.y + bounds.height
        ) {
          return { elementId: el.id, mode: 'move' };
        }
      }
    }
    return null;
  }

  private triggerImageUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_SIZE) {
        alert('图片大小不能超过5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > MAX_IMAGE_DISPLAY_WIDTH) {
            const ratio = MAX_IMAGE_DISPLAY_WIDTH / w;
            w = MAX_IMAGE_DISPLAY_WIDTH;
            h = h * ratio;
          }
          const store = useElementStore.getState();
          const cx = this.canvas.getBoundingClientRect().width / 2 - w / 2;
          const cy = this.canvas.getBoundingClientRect().height / 2 - h / 2;
          const element: ImageElement = {
            id: uuidv4(),
            type: 'image',
            userId: store.currentUserId,
            color: store.currentUserColor,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            x: cx,
            y: cy,
            width: w,
            height: h,
            src,
            originalWidth: img.width,
            originalHeight: img.height,
          };
          this.imageCache.set(element.id, img);
          syncScheduler.immediateAdd(element);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  public addTextElement(x: number, y: number, content: string): void {
    if (!content.trim()) return;
    const store = useElementStore.getState();
    const fontSize = 16;
    const padding = 16;

    this.ctx.font = `${fontSize}px sans-serif`;
    const metrics = this.ctx.measureText(content);
    const width = metrics.width + padding * 2;
    const height = fontSize + padding * 2;

    const element: TextElement = {
      id: uuidv4(),
      type: 'text',
      userId: store.currentUserId,
      color: '#333333',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      x,
      y,
      content,
      fontSize,
      bgColor: '#FFF3CD',
      width,
      height,
    };
    syncScheduler.immediateAdd(element);
  }

  private startRenderLoop(): void {
    const render = (time: number) => {
      this.frameCount++;
      if (time - this.lastRenderTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastRenderTime = time;
      }
      this.render();
      this.rafId = requestAnimationFrame(render);
    };
    this.rafId = requestAnimationFrame(render);
  }

  getFPS(): number {
    return this.fps;
  }

  private render(): void {
    const store = useElementStore.getState();
    const w = this.canvas.getBoundingClientRect().width;
    const h = this.canvas.getBoundingClientRect().height;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    this.drawBackground(ctx, w, h);

    for (const el of store.elements) {
      const isHighlighted = store.replay.highlightedElementId === el.id;
      this.drawElement(ctx, el, isHighlighted);
    }

    if (store.selectedElementId) {
      const el = store.elements.find((e) => e.id === store.selectedElementId);
      if (el) this.drawSelectionHandles(ctx, el);
    }

    if (this.state.isDrawing && this.state.tempPoints.length > 0) {
      this.drawTempDrawing(ctx);
    }

    if (this.state.isDrawing && useElementStore.getState().tool !== 'brush' && useElementStore.getState().tool !== 'select') {
      this.drawTempShape(ctx);
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
    gradient.addColorStop(0, '#1A1A2E');
    gradient.addColorStop(1, '#2D2D44');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  private drawElement(
    ctx: CanvasRenderingContext2D,
    el: WhiteboardElement,
    highlighted: boolean,
  ): void {
    ctx.save();

    if (highlighted) {
      ctx.globalAlpha = 0.6;
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 20;
    }

    switch (el.type) {
      case 'path':
        this.drawPath(ctx, el as PathElement);
        break;
      case 'rectangle':
        this.drawRectangle(ctx, el as RectangleElement);
        break;
      case 'circle':
        this.drawCircle(ctx, el as CircleElement);
        break;
      case 'polygon':
        this.drawPolygon(ctx, el as PolygonElement);
        break;
      case 'text':
        this.drawText(ctx, el as TextElement);
        break;
      case 'image':
        this.drawImage(ctx, el as ImageElement);
        break;
    }

    ctx.restore();
  }

  private drawPath(ctx: CanvasRenderingContext2D, el: PathElement): void {
    if (el.points.length < 2) return;
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length; i++) {
      ctx.lineTo(el.points[i].x, el.points[i].y);
    }
    ctx.stroke();
  }

  private drawRectangle(ctx: CanvasRenderingContext2D, el: RectangleElement): void {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.borderWidth;
    ctx.lineJoin = 'round';
    const r = Math.min(el.borderRadius, el.width / 2, el.height / 2);
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, el.width, el.height, r);
    ctx.stroke();
  }

  private drawCircle(ctx: CanvasRenderingContext2D, el: CircleElement): void {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.borderWidth;
    ctx.beginPath();
    ctx.ellipse(el.cx, el.cy, el.radiusX, el.radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, el: PolygonElement): void {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.borderWidth;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < el.sides; i++) {
      const angle = el.rotation + (i * 2 * Math.PI) / el.sides;
      const px = el.cx + el.radius * Math.cos(angle);
      const py = el.cy + el.radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  private drawText(ctx: CanvasRenderingContext2D, el: TextElement): void {
    const w = el.width || 100;
    const h = el.height || 50;
    ctx.fillStyle = el.bgColor;
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, w, h, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = el.color;
    ctx.font = `${el.fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(el.content, el.x + 16, el.y + h / 2);
  }

  private drawImage(ctx: CanvasRenderingContext2D, el: ImageElement): void {
    let img = this.imageCache.get(el.id);
    if (!img) {
      img = new Image();
      img.src = el.src;
      this.imageCache.set(el.id, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(img, el.x, el.y, el.width, el.height);
      ctx.restore();
    }
  }

  private drawTempDrawing(ctx: CanvasRenderingContext2D): void {
    const store = useElementStore.getState();
    if (this.state.tempPoints.length < 2) return;
    ctx.strokeStyle = store.currentUserColor;
    ctx.lineWidth = store.brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(this.state.tempPoints[0].x, this.state.tempPoints[0].y);
    for (let i = 1; i < this.state.tempPoints.length; i++) {
      ctx.lineTo(this.state.tempPoints[i].x, this.state.tempPoints[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawTempShape(ctx: CanvasRenderingContext2D): void {
    const store = useElementStore.getState();
    const tool = store.tool;
    ctx.strokeStyle = store.currentUserColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([6, 4]);

    const sx = this.state.startX;
    const sy = this.state.startY;
    const cx = this.state.currentX;
    const cy = this.state.currentY;

    if (tool === 'rectangle') {
      const x = Math.min(sx, cx);
      const y = Math.min(sy, cy);
      const w = Math.abs(cx - sx);
      const h = Math.abs(cy - sy);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, store.borderRadius);
      ctx.stroke();
    } else if (tool === 'circle') {
      const mcx = (sx + cx) / 2;
      const mcy = (sy + cy) / 2;
      const rx = Math.abs(cx - sx) / 2;
      const ry = Math.abs(cy - sy) / 2;
      ctx.beginPath();
      ctx.ellipse(mcx, mcy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'polygon') {
      const mcx = (sx + cx) / 2;
      const mcy = (sy + cy) / 2;
      const r = Math.max(Math.abs(cx - sx) / 2, Math.abs(cy - sy) / 2);
      ctx.beginPath();
      for (let i = 0; i < store.polygonSides; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / store.polygonSides;
        const px = mcx + r * Math.cos(angle);
        const py = mcy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  private drawSelectionHandles(ctx: CanvasRenderingContext2D, el: WhiteboardElement): void {
    const bounds = this.getElementBounds(el);
    ctx.save();
    ctx.strokeStyle = '#6BCB77';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
    ctx.setLineDash([]);

    const handles: [number, number][] = [
      [bounds.x, bounds.y],
      [bounds.x + bounds.width, bounds.y],
      [bounds.x, bounds.y + bounds.height],
      [bounds.x + bounds.width, bounds.y + bounds.height],
    ];
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#6BCB77';
    handles.forEach(([hx, hy]) => {
      ctx.fillRect(hx - 5, hy - 5, 10, 10);
      ctx.strokeRect(hx - 5, hy - 5, 10, 10);
    });
    ctx.restore();
  }
}
