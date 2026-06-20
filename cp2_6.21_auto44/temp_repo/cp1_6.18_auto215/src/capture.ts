import type { Point } from './types';

export interface CaptureEvents {
  onPoint: (point: Point) => void;
  onStrokeStart: (point: Point) => void;
  onStrokeEnd: (point: Point) => void;
  onSwipeLeft: () => void;
}

export class Capture {
  private canvas: HTMLCanvasElement;
  private events: CaptureEvents;
  private isDrawing = false;
  private currentStrokeStart: Point | null = null;
  private lastSampleTime = 0;
  private readonly SAMPLE_INTERVAL = 10;
  private readonly SWIPE_MIN_DISTANCE = 150;
  private readonly SWIPE_MAX_Y_DEV = 60;
  private abortedSwipe = false;

  constructor(canvas: HTMLCanvasElement, events: CaptureEvents) {
    this.canvas = canvas;
    this.events = events;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getCanvasPoint(clientX: number, clientY: number, pressure = 0.5): Point {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(this.canvas.width, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(this.canvas.height, (clientY - rect.top) * scaleY)),
      pressure: Math.max(0, Math.min(1, pressure)),
      timestamp: performance.now(),
    };
  }

  private shouldSample(): boolean {
    const now = performance.now();
    if (now - this.lastSampleTime >= this.SAMPLE_INTERVAL) {
      this.lastSampleTime = now;
      return true;
    }
    return false;
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const pressure = (e as PointerEvent).pressure;
    const p = pressure !== undefined && pressure > 0 ? 0.5 + pressure * 0.5 : 0.5;
    this.startStroke(this.getCanvasPoint(e.clientX, e.clientY, p));
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDrawing) return;
    const pressure = (e as PointerEvent).pressure;
    const p = pressure !== undefined && pressure > 0 ? 0.5 + pressure * 0.5 : 0.5;
    const point = this.getCanvasPoint(e.clientX, e.clientY, p);
    this.checkSwipeValidity(point);
    if (this.shouldSample()) {
      this.emitPoint(point);
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.isDrawing) return;
    this.endStroke(this.getCanvasPoint(e.clientX, e.clientY, 0));
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    const pressure = touch.force !== undefined && touch.force > 0 ? touch.force : 0.7;
    this.startStroke(this.getCanvasPoint(touch.clientX, touch.clientY, pressure));
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.isDrawing) return;
    const touch = e.touches[0];
    const pressure = touch.force !== undefined && touch.force > 0 ? touch.force : 0.7;
    const point = this.getCanvasPoint(touch.clientX, touch.clientY, pressure);
    this.checkSwipeValidity(point);
    if (this.shouldSample()) {
      this.emitPoint(point);
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.isDrawing) return;
    const touch = e.changedTouches[0];
    this.endStroke(this.getCanvasPoint(touch.clientX, touch.clientY, 0));
  };

  private startStroke(point: Point): void {
    this.isDrawing = true;
    this.currentStrokeStart = point;
    this.lastSampleTime = point.timestamp;
    this.abortedSwipe = false;
    this.events.onStrokeStart(point);
    this.emitPoint(point);
  }

  private checkSwipeValidity(point: Point): void {
    if (!this.currentStrokeStart || this.abortedSwipe) return;
    const dx = point.x - this.currentStrokeStart.x;
    const dy = Math.abs(point.y - this.currentStrokeStart.y);
    if (dy > this.SWIPE_MAX_Y_DEV) {
      this.abortedSwipe = true;
    }
    if (dx > 0 && dy > this.SWIPE_MAX_Y_DEV * 0.5) {
      this.abortedSwipe = true;
    }
  }

  private emitPoint(point: Point): void {
    this.events.onPoint(point);
  }

  private endStroke(point: Point): void {
    if (!this.isDrawing || !this.currentStrokeStart) return;

    const dx = point.x - this.currentStrokeStart.x;
    const dy = Math.abs(point.y - this.currentStrokeStart.y);

    this.isDrawing = false;
    this.events.onStrokeEnd(point);

    if (
      !this.abortedSwipe &&
      dx < -this.SWIPE_MIN_DISTANCE &&
      dy < this.SWIPE_MAX_Y_DEV
    ) {
      this.events.onSwipeLeft();
    }

    this.currentStrokeStart = null;
  }

  public destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}
