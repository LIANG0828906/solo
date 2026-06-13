import * as THREE from 'three';

interface PendingPoint {
  x: number;
  y: number;
  timestamp: number;
}

type PathClosedCallback = (points: THREE.Vector2[]) => void;

export class DrawManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onPathClosed: PathClosedCallback;
  private inkDelay: number = 200;
  private isDrawing: boolean = false;
  private pendingPoints: PendingPoint[] = [];
  private renderedPoints: { x: number; y: number }[] = [];
  private animationId: number | null = null;
  private minDistance: number = 2;

  constructor(canvas: HTMLCanvasElement, onPathClosed: PathClosedCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onPathClosed = onPathClosed;
    this.resizeCanvas();
    this.bindEvents();
    this.startAnimationLoop();
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
    this.canvas.addEventListener('dblclick', this.handleDoubleClick);
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    this.resizeCanvas();
    this.redrawAll();
  };

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.isDrawing = true;
    const { x, y } = this.getCanvasCoords(e);
    this.addPoint(x, y);
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDrawing) return;
    const { x, y } = this.getCanvasCoords(e);
    const last = this.renderedPoints.length > 0
      ? this.renderedPoints[this.renderedPoints.length - 1]
      : (this.pendingPoints.length > 0 ? this.pendingPoints[this.pendingPoints.length - 1] : null);
    
    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.minDistance) return;
    }
    this.addPoint(x, y);
  };

  private handleMouseUp = (): void => {
    this.isDrawing = false;
  };

  private handleDoubleClick = (): void => {
    this.isDrawing = false;
    this.flushPendingPoints();
    if (this.renderedPoints.length < 3) return;
    
    const first = this.renderedPoints[0];
    const last = this.renderedPoints[this.renderedPoints.length - 1];
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 3;
    this.ctx.moveTo(last.x, last.y);
    this.ctx.lineTo(first.x, first.y);
    this.ctx.stroke();
    this.renderedPoints.push({ ...first });

    const canvasRect = this.canvas.getBoundingClientRect();
    const centerX = canvasRect.width / 2;
    const centerY = canvasRect.height / 2;
    const scale = Math.min(canvasRect.width, canvasRect.height) * 0.01;

    const threePoints = this.renderedPoints
      .slice(0, -1)
      .map(p => new THREE.Vector2(
        (p.x - centerX) / scale,
        (centerY - p.y) / scale
      ));

    this.onPathClosed(threePoints);
    this.clearCanvasInternal();
  };

  private addPoint(x: number, y: number): void {
    this.pendingPoints.push({ x, y, timestamp: performance.now() });
  }

  private flushPendingPoints(): void {
    while (this.pendingPoints.length > 0) {
      const pt = this.pendingPoints.shift()!;
      this.renderSinglePoint(pt.x, pt.y);
    }
  }

  private renderSinglePoint(x: number, y: number): void {
    const prev = this.renderedPoints.length > 0
      ? this.renderedPoints[this.renderedPoints.length - 1]
      : null;

    this.ctx.beginPath();
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 3;

    if (prev) {
      this.ctx.moveTo(prev.x, prev.y);
      const midX = (prev.x + x) / 2;
      const midY = (prev.y + y) / 2;
      this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      this.ctx.lineTo(x, y);
    } else {
      this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#333333';
      this.ctx.fill();
    }
    this.ctx.stroke();

    this.renderedPoints.push({ x, y });
  }

  private startAnimationLoop(): void {
    const loop = (): void => {
      const now = performance.now();
      while (this.pendingPoints.length > 0 && now - this.pendingPoints[0].timestamp >= this.inkDelay) {
        const pt = this.pendingPoints.shift()!;
        this.renderSinglePoint(pt.x, pt.y);
      }
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private redrawAll(): void {
    const points = [...this.renderedPoints];
    this.clearCanvasInternal();
    for (const p of points) {
      this.renderSinglePoint(p.x, p.y);
    }
  }

  private clearCanvasInternal(): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.renderedPoints = [];
    this.pendingPoints = [];
  }

  public setInkDelay(ms: number): void {
    this.inkDelay = ms;
  }

  public clear(): void {
    this.clearCanvasInternal();
  }

  public getPointCount(): number {
    return this.renderedPoints.length + this.pendingPoints.length;
  }

  public dispose(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
    window.removeEventListener('resize', this.handleResize);
  }
}
