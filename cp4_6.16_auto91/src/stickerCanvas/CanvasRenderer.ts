import { CanvasEngine, DrawingOperation, PathPoint } from './CanvasEngine';

export interface TextEditState {
  operationId: string;
  text: string;
  fontSize: number;
  color: string;
  x: number;
  y: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: CanvasEngine;
  private currentTool: string = 'brush';
  private brushSize: number = 3;
  private brushColor: string = '#000000';
  private isDrawing: boolean = false;
  private currentPath: PathPoint[] = [];
  private currentPathOp: DrawingOperation | null = null;
  private shapeStart: { x: number; y: number } | null = null;
  private tempShapeOp: DrawingOperation | null = null;
  private animFrameId: number = 0;
  private needsRender: boolean = true;
  private selectedTextId: string | null = null;
  private editingTextId: string | null = null;
  private isDraggingText: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private dragOriginalPos: { x: number; y: number } = { x: 0, y: 0 };
  private pendingTextPlace: { x: number; y: number } | null = null;

  public onTextSelected?: (id: string | null, op?: DrawingOperation | null) => void;
  public onTextDoubleClick?: (state: TextEditState) => void;
  public onTextPlace?: (x: number, y: number) => void;

  constructor(canvas: HTMLCanvasElement, engine: CanvasEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
    engine.onChange = () => { this.needsRender = true; };
    this.setupEvents();
    this.startRenderLoop();
  }

  setTool(tool: string): void {
    this.currentTool = tool;
    if (tool !== 'text') {
      this.selectedTextId = null;
      this.onTextSelected?.(null);
    }
    this.updateCursor();
  }

  setBrushSize(size: number): void {
    this.brushSize = size;
  }

  setBrushColor(color: string): void {
    this.brushColor = color;
  }

  setSelectedTextId(id: string | null): void {
    this.selectedTextId = id;
    this.needsRender = true;
  }

  setEditingTextId(id: string | null): void {
    this.editingTextId = id;
    this.needsRender = true;
  }

  private updateCursor(): void {
    if (this.currentTool === 'text') {
      this.canvas.style.cursor = 'text';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  private getCanvasPos(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private setupEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerUp);
    this.canvas.addEventListener('dblclick', this.onDoubleClick);
    this.updateCursor();
  }

  private onPointerDown = (e: PointerEvent): void => {
    const pos = this.getCanvasPos(e);

    if (this.currentTool === 'text') {
      const hitText = this.hitTestText(pos.x, pos.y);
      if (hitText) {
        this.selectedTextId = hitText.id;
        this.isDraggingText = true;
        this.dragOffset = {
          x: pos.x - (hitText.x || 0),
          y: pos.y - (hitText.y || 0),
        };
        this.dragOriginalPos = { x: hitText.x || 0, y: hitText.y || 0 };
        this.onTextSelected?.(hitText.id, hitText);
        this.needsRender = true;
        return;
      }
      this.selectedTextId = null;
      this.onTextSelected?.(null);
      this.pendingTextPlace = { x: pos.x, y: pos.y };
      this.onTextPlace?.(pos.x, pos.y);
      this.needsRender = true;
      return;
    }

    this.isDrawing = true;
    this.canvas.setPointerCapture(e.pointerId);

    if (this.currentTool === 'brush') {
      this.currentPath = [{ x: pos.x, y: pos.y }];
      this.currentPathOp = {
        id: '',
        type: 'path',
        points: this.currentPath,
        strokeWidth: this.brushSize,
        strokeColor: this.brushColor,
      };
    } else if (this.currentTool === 'rect' || this.currentTool === 'ellipse') {
      this.shapeStart = { x: pos.x, y: pos.y };
      this.tempShapeOp = {
        id: '',
        type: this.currentTool as 'rect' | 'ellipse',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: this.brushColor,
        strokeColor: this.brushColor,
        strokeWidth: this.brushSize,
        borderRadius: this.currentTool === 'rect' ? 8 : 0,
      };
    }
    this.needsRender = true;
  };

  private onPointerMove = (e: PointerEvent): void => {
    const pos = this.getCanvasPos(e);

    if (this.currentTool === 'text' && this.isDraggingText && this.selectedTextId) {
      const op = this.engine.getOperationById(this.selectedTextId);
      if (op) {
        op.x = pos.x - this.dragOffset.x;
        op.y = pos.y - this.dragOffset.y;
        this.onTextSelected?.(op.id, op);
        this.needsRender = true;
      }
      return;
    }

    if (!this.isDrawing) return;

    if (this.currentTool === 'brush' && this.currentPathOp) {
      this.currentPath.push({ x: pos.x, y: pos.y });
      this.needsRender = true;
    } else if ((this.currentTool === 'rect' || this.currentTool === 'ellipse') && this.shapeStart && this.tempShapeOp) {
      this.tempShapeOp.x = Math.min(this.shapeStart.x, pos.x);
      this.tempShapeOp.y = Math.min(this.shapeStart.y, pos.y);
      this.tempShapeOp.width = Math.abs(pos.x - this.shapeStart.x);
      this.tempShapeOp.height = Math.abs(pos.y - this.shapeStart.y);
      this.needsRender = true;
    }
  };

  private onPointerUp = (_e: PointerEvent): void => {
    if (this.currentTool === 'text') {
      if (this.isDraggingText && this.selectedTextId) {
        const op = this.engine.getOperationById(this.selectedTextId);
        if (op) {
          const newX = op.x || 0;
          const newY = op.y || 0;
          if (newX !== this.dragOriginalPos.x || newY !== this.dragOriginalPos.y) {
            this.engine.commitDrag(this.selectedTextId, this.dragOriginalPos.x, this.dragOriginalPos.y);
          }
        }
        this.isDraggingText = false;
      }
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.currentTool === 'brush' && this.currentPathOp && this.currentPath.length > 0) {
      this.engine.addOperation({
        type: 'path',
        points: [...this.currentPath],
        strokeWidth: this.brushSize,
        strokeColor: this.brushColor,
      });
      this.currentPath = [];
      this.currentPathOp = null;
    } else if ((this.currentTool === 'rect' || this.currentTool === 'ellipse') && this.tempShapeOp) {
      if (this.tempShapeOp.width! > 2 && this.tempShapeOp.height! > 2) {
        this.engine.addOperation({
          type: this.tempShapeOp.type,
          x: this.tempShapeOp.x,
          y: this.tempShapeOp.y,
          width: this.tempShapeOp.width,
          height: this.tempShapeOp.height,
          fill: this.brushColor,
          strokeColor: this.brushColor,
          strokeWidth: this.brushSize,
          borderRadius: this.tempShapeOp.borderRadius,
        });
      }
      this.tempShapeOp = null;
      this.shapeStart = null;
    }
    this.needsRender = true;
  };

  private onDoubleClick = (e: MouseEvent): void => {
    if (this.currentTool !== 'text') return;
    const pos = this.getCanvasPos(e as unknown as PointerEvent);
    const hitText = this.hitTestText(pos.x, pos.y);
    if (hitText) {
      this.selectedTextId = hitText.id;
      this.onTextDoubleClick?.({
        operationId: hitText.id,
        text: hitText.text || '',
        fontSize: hitText.fontSize || 24,
        color: hitText.color || '#000000',
        x: hitText.x || 0,
        y: hitText.y || 0,
      });
      this.onTextSelected?.(hitText.id, hitText);
      this.needsRender = true;
    }
  };

  hitTestText(x: number, y: number): DrawingOperation | null {
    const ops = this.engine.getOperations();
    for (let i = ops.length - 1; i >= 0; i--) {
      const op = ops[i];
      if (op.type !== 'text') continue;
      if (this.editingTextId && op.id === this.editingTextId) continue;
      const bounds = this.getTextBounds(op);
      if (
        x >= bounds.x - 4 &&
        x <= bounds.x + bounds.width + 4 &&
        y >= bounds.y - 4 &&
        y <= bounds.y + bounds.height + 4
      ) {
        return op;
      }
    }
    return null;
  }

  getTextBounds(op: DrawingOperation): { x: number; y: number; width: number; height: number } {
    const fontSize = op.fontSize || 24;
    const fontFamily = op.fontFamily || 'Arial, sans-serif';
    this.ctx.save();
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = this.ctx.measureText(op.text || '');
    const width = metrics.width;
    const height = fontSize * 1.2;
    this.ctx.restore();
    return {
      x: op.x || 0,
      y: (op.y || 0) - fontSize,
      width,
      height,
    };
  }

  exportCleanImage(): string {
    const savedSelectedId = this.selectedTextId;
    const savedEditingId = this.editingTextId;
    this.selectedTextId = null;
    this.editingTextId = null;

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, width, height);

    const ops = this.engine.getOperations();
    for (const op of ops) {
      this.drawOperation(op);
    }

    const dataUrl = this.canvas.toDataURL('image/png');

    this.selectedTextId = savedSelectedId;
    this.editingTextId = savedEditingId;
    this.needsRender = true;

    return dataUrl;
  }

  render(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.drawGrid(width, height);

    const ops = this.engine.getOperations();
    for (const op of ops) {
      if (this.editingTextId && op.id === this.editingTextId && op.type === 'text') {
        continue;
      }
      this.drawOperation(op);
    }

    if (this.currentPathOp && this.currentPath.length > 0) {
      this.drawPath(this.currentPath, this.brushSize, this.brushColor);
    }

    if (this.tempShapeOp) {
      this.drawOperation(this.tempShapeOp);
    }

    if (this.selectedTextId && !this.editingTextId) {
      const op = this.engine.getOperationById(this.selectedTextId);
      if (op && op.type === 'text') {
        this.drawTextSelection(op);
      }
    }
  }

  private drawGrid(w: number, h: number): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    this.ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x <= w; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + 0.5, 0);
      this.ctx.lineTo(x + 0.5, h);
      this.ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + 0.5);
      this.ctx.lineTo(w, y + 0.5);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawOperation(op: DrawingOperation): void {
    switch (op.type) {
      case 'path':
        if (op.points && op.points.length > 0) {
          this.drawPath(op.points, op.strokeWidth || 2, op.strokeColor || '#000');
        }
        break;
      case 'rect':
        this.drawRect(op);
        break;
      case 'ellipse':
        this.drawEllipse(op);
        break;
      case 'text':
        this.drawText(op);
        break;
    }
  }

  private drawPath(points: PathPoint[], strokeWidth: number, strokeColor: string): void {
    if (points.length < 1) return;
    this.ctx.save();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 1) {
      this.ctx.lineTo(points[0].x + 0.1, points[0].y + 0.1);
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2;
        const my = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
      }
      const last = points[points.length - 1];
      this.ctx.lineTo(last.x, last.y);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawRect(op: DrawingOperation): void {
    const x = op.x || 0;
    const y = op.y || 0;
    const w = op.width || 0;
    const h = op.height || 0;
    const r = op.borderRadius || 0;
    this.ctx.save();
    this.ctx.fillStyle = op.fill || '#000';
    this.ctx.strokeStyle = op.strokeColor || '#000';
    this.ctx.lineWidth = op.strokeWidth || 2;
    this.ctx.beginPath();
    if (r > 0 && w > 0 && h > 0) {
      const cr = Math.min(r, w / 2, h / 2);
      this.ctx.moveTo(x + cr, y);
      this.ctx.arcTo(x + w, y, x + w, y + h, cr);
      this.ctx.arcTo(x + w, y + h, x, y + h, cr);
      this.ctx.arcTo(x, y + h, x, y, cr);
      this.ctx.arcTo(x, y, x + w, y, cr);
      this.ctx.closePath();
    } else {
      this.ctx.rect(x, y, w, h);
    }
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawEllipse(op: DrawingOperation): void {
    const cx = (op.x || 0) + (op.width || 0) / 2;
    const cy = (op.y || 0) + (op.height || 0) / 2;
    const rx = Math.max(0.1, (op.width || 0) / 2);
    const ry = Math.max(0.1, (op.height || 0) / 2);
    this.ctx.save();
    this.ctx.fillStyle = op.fill || '#000';
    this.ctx.strokeStyle = op.strokeColor || '#000';
    this.ctx.lineWidth = op.strokeWidth || 2;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawText(op: DrawingOperation): void {
    this.ctx.save();
    this.ctx.fillStyle = op.color || '#000';
    this.ctx.font = `${op.fontSize || 24}px ${op.fontFamily || 'Arial, sans-serif'}`;
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.fillText(op.text || '', op.x || 0, op.y || 0);
    this.ctx.restore();
  }

  private drawTextSelection(op: DrawingOperation): void {
    const bounds = this.getTextBounds(op);
    const pad = 6;
    this.ctx.save();
    this.ctx.strokeStyle = '#4A90D9';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(
      bounds.x - pad,
      bounds.y - pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2
    );
    this.ctx.setLineDash([]);
    const handleSize = 7;
    const corners = [
      { x: bounds.x - pad, y: bounds.y - pad },
      { x: bounds.x + bounds.width + pad, y: bounds.y - pad },
      { x: bounds.x - pad, y: bounds.y + bounds.height + pad },
      { x: bounds.x + bounds.width + pad, y: bounds.y + bounds.height + pad },
    ];
    this.ctx.fillStyle = '#4A90D9';
    for (const c of corners) {
      this.ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    }
    this.ctx.restore();
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.needsRender) {
        this.render();
        this.needsRender = false;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  forceRender(): void {
    this.needsRender = true;
  }

  destroy(): void {
    cancelAnimationFrame(this.animFrameId);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerUp);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
  }
}
