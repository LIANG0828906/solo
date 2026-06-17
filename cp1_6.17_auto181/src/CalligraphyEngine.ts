export interface Point {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  pathData: string;
}

export interface CalligraphyWork {
  id: string;
  strokes: Stroke[];
  width: number;
  height: number;
  createdAt: string;
  userId: string;
  isPublic: boolean;
  title?: string;
}

const BASE_WIDTH = 4;
const MIN_WIDTH = 2;
const MAX_WIDTH = 8;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export class CalligraphyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private currentStroke: Point[] = [];
  private isDrawing = false;
  private color: string = '#1A1A1A';
  private lastPoint: Point | null = null;
  private onStrokeComplete?: (stroke: Stroke) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
    this.bindEvents();
  }

  setColor(color: string): void {
    this.color = color;
  }

  getStrokes(): Stroke[] {
    return this.strokes;
  }

  setStrokes(strokes: Stroke[]): void {
    this.strokes = strokes;
    this.redraw();
  }

  clear(): void {
    this.strokes = [];
    this.currentStroke = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setOnStrokeComplete(callback: (stroke: Stroke) => void): void {
    this.onStrokeComplete = callback;
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  private getCanvasPoint(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };
  }

  private handleMouseDown = (e: MouseEvent): void => {
    this.startDrawing(this.getCanvasPoint(e.clientX, e.clientY));
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDrawing) return;
    this.drawPoint(this.getCanvasPoint(e.clientX, e.clientY));
  };

  private handleMouseUp = (): void => {
    if (this.isDrawing) {
      this.endDrawing();
    }
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    this.startDrawing(this.getCanvasPoint(touch.clientX, touch.clientY));
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.isDrawing) return;
    const touch = e.touches[0];
    this.drawPoint(this.getCanvasPoint(touch.clientX, touch.clientY));
  };

  private handleTouchEnd = (): void => {
    if (this.isDrawing) {
      this.endDrawing();
    }
  };

  private startDrawing(point: Point): void {
    this.isDrawing = true;
    this.currentStroke = [point];
    this.lastPoint = point;
    
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, BASE_WIDTH / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  private calculateWidth(speed: number): number {
    const normalizedSpeed = Math.min(speed / 5, 1);
    return BASE_WIDTH + (MAX_WIDTH - BASE_WIDTH) * (1 - normalizedSpeed);
  }

  private calculateSpeed(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const time = (p2.timestamp - p1.timestamp) / 1000;
    return time > 0 ? distance / time : 0;
  }

  private drawPoint(point: Point): void {
    if (!this.lastPoint) return;

    const speed = this.calculateSpeed(this.lastPoint, point);
    const width = this.calculateWidth(speed);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.currentStroke.push(point);
    this.lastPoint = point;
  }

  private endDrawing(): void {
    if (this.currentStroke.length < 2) {
      this.isDrawing = false;
      this.currentStroke = [];
      this.lastPoint = null;
      return;
    }

    const pathData = this.generatePathData(this.currentStroke);
    const stroke: Stroke = {
      id: generateId(),
      points: [...this.currentStroke],
      color: this.color,
      width: BASE_WIDTH,
      pathData
    };

    this.strokes.push(stroke);
    this.isDrawing = false;
    this.currentStroke = [];
    this.lastPoint = null;

    if (this.onStrokeComplete) {
      this.onStrokeComplete(stroke);
    }
  }

  private generatePathData(points: Point[]): string {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${xc.toFixed(2)} ${yc.toFixed(2)}`;
    }
    
    if (points.length >= 2) {
      const last = points[points.length - 1];
      path += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
    }
    
    return path;
  }

  private redraw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const stroke of this.strokes) {
      const path = new Path2D(stroke.pathData);
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke(path);
    }
  }

  toSVG(): string {
    const paths = this.strokes.map(s => 
      `<path d="${s.pathData}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('');
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.canvas.width}" height="${this.canvas.height}" viewBox="0 0 ${this.canvas.width} ${this.canvas.height}">${paths}</svg>`;
  }

  getWorkData(userId: string): Omit<CalligraphyWork, 'id' | 'createdAt'> {
    return {
      strokes: this.strokes,
      width: this.canvas.width,
      height: this.canvas.height,
      userId,
      isPublic: true
    };
  }

  static renderToCanvas(canvas: HTMLCanvasElement, strokes: Stroke[]): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const stroke of strokes) {
      const path = new Path2D(stroke.pathData);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(path);
    }
  }
}
