export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface TrajectorySegment {
  points: TrajectoryPoint[];
  createdAt: number;
}

export interface GestureEvents {
  onStart?: () => void;
  onMove?: (pt: TrajectoryPoint) => void;
  onEnd?: (points: TrajectoryPoint[]) => void;
  onCancel?: () => void;
}

const MIN_DISTANCE = 3;
const DEFAULT_FADE_TIME = 1500;

export class GestureRecognizer {
  private canvas: HTMLCanvasElement;
  private centerX: number;
  private centerY: number;
  private radius: number;
  private isDrawing: boolean;
  private currentTrajectory: TrajectoryPoint[];
  private segments: TrajectorySegment[];
  private events: GestureEvents;
  private fadeTime: number;

  private onMouseDownBound: (e: MouseEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseUpBound: (e: MouseEvent) => void;
  private onMouseLeaveBound: (e: MouseEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    centerX: number,
    centerY: number,
    radius: number,
    events: GestureEvents
  ) {
    this.canvas = canvas;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.isDrawing = false;
    this.currentTrajectory = [];
    this.segments = [];
    this.events = events;
    this.fadeTime = DEFAULT_FADE_TIME;

    this.onMouseDownBound = this.onMouseDown.bind(this);
    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onMouseUpBound = this.onMouseUp.bind(this);
    this.onMouseLeaveBound = this.onMouseLeave.bind(this);

    this.canvas.addEventListener('mousedown', this.onMouseDownBound);
    this.canvas.addEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.addEventListener('mouseup', this.onMouseUpBound);
    this.canvas.addEventListener('mouseleave', this.onMouseLeaveBound);
  }

  private getCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (clientX - rect.left) * (this.canvas.width / rect.width) / dpr;
    const y = (clientY - rect.top) * (this.canvas.height / rect.height) / dpr;
    return { x, y };
  }

  private static distance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isInsideCircle(x: number, y: number): boolean {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  setCenter(centerX: number, centerY: number, radius: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
  }

  getActiveSegments(): TrajectorySegment[] {
    const now = Date.now();
    return this.segments.filter(
      (seg) => now - seg.createdAt < this.fadeTime
    );
  }

  update(): void {
    const now = Date.now();
    this.segments = this.segments.filter(
      (seg) => now - seg.createdAt < this.fadeTime
    );
  }

  private onMouseDown(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoordinates(e.clientX, e.clientY);
    if (!this.isInsideCircle(x, y)) {
      return;
    }
    this.isDrawing = true;
    const point: TrajectoryPoint = {
      x,
      y,
      timestamp: Date.now(),
    };
    this.currentTrajectory = [point];
    if (this.events.onStart) {
      this.events.onStart();
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) {
      return;
    }
    const { x, y } = this.getCanvasCoordinates(e.clientX, e.clientY);
    const lastPoint =
      this.currentTrajectory[this.currentTrajectory.length - 1];
    if (
      lastPoint &&
      GestureRecognizer.distance(lastPoint.x, lastPoint.y, x, y) <
        MIN_DISTANCE
    ) {
      return;
    }
    const point: TrajectoryPoint = {
      x,
      y,
      timestamp: Date.now(),
    };
    this.currentTrajectory.push(point);
    if (this.events.onMove) {
      this.events.onMove(point);
    }
  }

  private endDrawing(cancelled: boolean): void {
    if (!this.isDrawing) {
      return;
    }
    this.isDrawing = false;
    const points = [...this.currentTrajectory];
    if (points.length > 0) {
      this.segments.push({
        points,
        createdAt: Date.now(),
      });
    }
    if (cancelled) {
      if (this.events.onCancel) {
        this.events.onCancel();
      }
    } else {
      if (this.events.onEnd) {
        this.events.onEnd(points);
      }
    }
    this.currentTrajectory = [];
  }

  private onMouseUp(_e: MouseEvent): void {
    this.endDrawing(false);
  }

  private onMouseLeave(_e: MouseEvent): void {
    this.endDrawing(true);
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
    this.canvas.removeEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.removeEventListener('mouseup', this.onMouseUpBound);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeaveBound);
  }
}
