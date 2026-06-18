import type { Point, Stroke, CharacterSegment, BoundingBox } from './types';

export interface StrokeEvents {
  onStrokeAdded: (stroke: Stroke) => void;
  onStrokeUpdated: (stroke: Stroke) => void;
  onSegmentReady: (segment: CharacterSegment) => void;
  onClear: () => void;
}

export class StrokeManager {
  private events: StrokeEvents;
  private strokes: Stroke[] = [];
  private segments: CharacterSegment[] = [];
  private currentStroke: Stroke | null = null;
  private currentSegmentStrokes: Stroke[] = [];
  private splitTimer: number | null = null;
  private readonly SPLIT_DELAY = 500;
  private readonly MAX_POINTS_PER_CHAR = 300;
  private readonly X_GAP_THRESHOLD = 30;
  private readonly Y_OFFSET_THRESHOLD = 60;

  constructor(events: StrokeEvents) {
    this.events = events;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private computeBounds(points: Point[]): BoundingBox {
    if (points.length === 0) {
      return {
        minX: 0, maxX: 0, minY: 0, maxY: 0,
        width: 0, height: 0, centerX: 0, centerY: 0,
      };
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const width = maxX - minX;
    const height = maxY - minY;
    return {
      minX, maxX, minY, maxY,
      width, height,
      centerX: minX + width / 2,
      centerY: minY + height / 2,
    };
  }

  private unionBounds(boundsList: BoundingBox[]): BoundingBox {
    if (boundsList.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const b of boundsList) {
      if (b.minX < minX) minX = b.minX;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxY > maxY) maxY = b.maxY;
    }
    const width = maxX - minX;
    const height = maxY - minY;
    return {
      minX, maxX, minY, maxY,
      width, height,
      centerX: minX + width / 2,
      centerY: minY + height / 2,
    };
  }

  public startStroke(point: Point): void {
    this.clearSplitTimer();
    this.currentStroke = {
      id: this.generateId(),
      points: [point],
      bounds: {
        minX: point.x, maxX: point.x, minY: point.y, maxY: point.y,
        width: 0, height: 0, centerX: point.x, centerY: point.y,
      },
    };
    this.events.onStrokeAdded(this.currentStroke);
  }

  public addPoint(point: Point): void {
    if (!this.currentStroke) return;
    this.currentStroke.points.push(point);
    const b = this.currentStroke.bounds;
    if (point.x < b.minX) b.minX = point.x;
    if (point.x > b.maxX) b.maxX = point.x;
    if (point.y < b.minY) b.minY = point.y;
    if (point.y > b.maxY) b.maxY = point.y;
    b.width = b.maxX - b.minX;
    b.height = b.maxY - b.minY;
    b.centerX = b.minX + b.width / 2;
    b.centerY = b.minY + b.height / 2;
    this.events.onStrokeUpdated(this.currentStroke);
  }

  public endStroke(_point: Point): void {
    if (!this.currentStroke) return;

    const stroke = this.currentStroke;
    this.strokes.push(stroke);

    const shouldSplit = this.shouldStartNewSegment(stroke);
    if (shouldSplit && this.currentSegmentStrokes.length > 0) {
      this.finalizeSegment();
    }

    let totalPoints = 0;
    for (const s of this.currentSegmentStrokes) {
      totalPoints += s.points.length;
    }
    totalPoints += stroke.points.length;

    if (totalPoints > this.MAX_POINTS_PER_CHAR && this.currentSegmentStrokes.length > 0) {
      this.finalizeSegment();
    }

    this.currentSegmentStrokes.push(stroke);
    this.currentStroke = null;

    this.scheduleSplit();
  }

  private shouldStartNewSegment(newStroke: Stroke): boolean {
    if (this.currentSegmentStrokes.length === 0) return false;

    const segBounds = this.unionBounds(this.currentSegmentStrokes.map(s => s.bounds));
    const newBounds = newStroke.bounds;

    const xGap = Math.min(
      Math.abs(newBounds.minX - segBounds.maxX),
      Math.abs(newBounds.maxX - segBounds.minX),
    );
    const yOffset = Math.abs(newBounds.centerY - segBounds.centerY);

    const isToTheRight = newBounds.minX > segBounds.maxX;
    const isBelow = newBounds.minY > segBounds.maxY;

    return (isToTheRight && xGap > this.X_GAP_THRESHOLD) ||
           (isBelow && yOffset > this.Y_OFFSET_THRESHOLD);
  }

  private scheduleSplit(): void {
    this.clearSplitTimer();
    this.splitTimer = window.setTimeout(() => {
      if (this.currentSegmentStrokes.length > 0) {
        this.finalizeSegment();
      }
    }, this.SPLIT_DELAY);
  }

  private clearSplitTimer(): void {
    if (this.splitTimer !== null) {
      clearTimeout(this.splitTimer);
      this.splitTimer = null;
    }
  }

  private finalizeSegment(): void {
    if (this.currentSegmentStrokes.length === 0) return;

    const segStrokes = [...this.currentSegmentStrokes];
    this.currentSegmentStrokes = [];

    const segment: CharacterSegment = {
      id: this.generateId(),
      strokes: segStrokes,
      bounds: this.unionBounds(segStrokes.map(s => s.bounds)),
      confidence: 0,
    };

    this.segments.push(segment);
    this.events.onSegmentReady(segment);
  }

  public getSegments(): CharacterSegment[] {
    return [...this.segments];
  }

  public getCurrentSegmentStrokes(): Stroke[] {
    return [...this.currentSegmentStrokes];
  }

  public getCurrentStroke(): Stroke | null {
    return this.currentStroke;
  }

  public flushPending(): void {
    this.clearSplitTimer();
    if (this.currentSegmentStrokes.length > 0) {
      this.finalizeSegment();
    }
  }

  public clearAll(): void {
    this.clearSplitTimer();
    this.strokes = [];
    this.segments = [];
    this.currentStroke = null;
    this.currentSegmentStrokes = [];
    this.events.onClear();
  }

  public updateSegment(segmentId: string, updates: Partial<CharacterSegment>): void {
    const idx = this.segments.findIndex(s => s.id === segmentId);
    if (idx !== -1) {
      this.segments[idx] = { ...this.segments[idx], ...updates };
    }
  }
}
