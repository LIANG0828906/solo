export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
  velocity: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  baseWidth: number;
  startTime: number;
  endTime: number;
}

export interface RawInputEvent {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

const SMOOTHING_WINDOW = 3;
const MIN_POINT_DISTANCE = 2;

function generateId(): string {
  return `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function euclideanDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function smoothPoint(points: Point[], index: number, windowSize: number): Point {
  const start = Math.max(0, index - windowSize);
  const end = Math.min(points.length - 1, index + windowSize);
  const slice = points.slice(start, end + 1);
  
  const avgX = slice.reduce((sum, p) => sum + p.x, 0) / slice.length;
  const avgY = slice.reduce((sum, p) => sum + p.y, 0) / slice.length;
  const avgPressure = slice.reduce((sum, p) => sum + p.pressure, 0) / slice.length;
  
  return {
    x: avgX,
    y: avgY,
    pressure: avgPressure,
    timestamp: points[index].timestamp,
    velocity: points[index].velocity
  };
}

function calculateVelocity(points: Point[], index: number): number {
  if (index === 0) return 0;
  const prev = points[index - 1];
  const curr = points[index];
  const timeDiff = curr.timestamp - prev.timestamp;
  if (timeDiff === 0) return 0;
  const distance = euclideanDistance(prev, curr);
  return distance / timeDiff;
}

function calculatePressure(velocity: number, basePressure: number = 0.5): number {
  const normalizedVelocity = Math.min(velocity / 3, 1);
  const pressure = basePressure + (1 - normalizedVelocity) * 0.5;
  return Math.max(0.3, Math.min(1.0, pressure));
}

export class StrokeAnalyzer {
  private currentStroke: Stroke | null = null;
  private strokes: Stroke[] = [];
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private lastAddedPoint: Point | null = null;

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  startStroke(x: number, y: number, color: string, baseWidth: number, pressure?: number): Point {
    const now = performance.now();
    const initialPoint: Point = {
      x,
      y,
      pressure: pressure ?? 0.5,
      timestamp: now,
      velocity: 0
    };

    this.currentStroke = {
      id: generateId(),
      points: [initialPoint],
      color,
      baseWidth,
      startTime: now,
      endTime: now
    };

    this.lastAddedPoint = initialPoint;
    this.emit('strokeStart', { stroke: this.currentStroke, point: initialPoint });
    return initialPoint;
  }

  addPoint(x: number, y: number, pressure?: number): Point | null {
    if (!this.currentStroke) return null;

    const now = performance.now();
    const tempPoint: Point = {
      x,
      y,
      pressure: pressure ?? 0.5,
      timestamp: now,
      velocity: 0
    };

    if (this.lastAddedPoint) {
      const distance = euclideanDistance(this.lastAddedPoint, tempPoint);
      if (distance < MIN_POINT_DISTANCE) return null;
    }

    tempPoint.velocity = calculateVelocity(
      [...this.currentStroke.points, tempPoint],
      this.currentStroke.points.length
    );
    tempPoint.pressure = calculatePressure(tempPoint.velocity, pressure);

    this.currentStroke.points.push(tempPoint);
    this.currentStroke.endTime = now;

    const lastIndex = this.currentStroke.points.length - 1;
    const smoothedPoint = smoothPoint(this.currentStroke.points, lastIndex, SMOOTHING_WINDOW);
    this.currentStroke.points[lastIndex] = smoothedPoint;

    this.lastAddedPoint = smoothedPoint;
    this.emit('pointAdded', { stroke: this.currentStroke, point: smoothedPoint });
    return smoothedPoint;
  }

  endStroke(): Stroke | null {
    if (!this.currentStroke) return null;

    const points = this.currentStroke.points;
    for (let i = 0; i < points.length; i++) {
      points[i] = smoothPoint(points, i, SMOOTHING_WINDOW);
    }

    this.strokes.push(this.currentStroke);
    const completedStroke = this.currentStroke;
    this.emit('strokeEnd', { stroke: completedStroke });
    this.currentStroke = null;
    this.lastAddedPoint = null;
    return completedStroke;
  }

  getStrokes(): Stroke[] {
    return [...this.strokes];
  }

  getCurrentStroke(): Stroke | null {
    return this.currentStroke ? { ...this.currentStroke } : null;
  }

  clearStrokes(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.lastAddedPoint = null;
    this.emit('strokesCleared', null);
  }

  setStrokes(strokes: Stroke[]): void {
    this.strokes = strokes.map(s => ({
      ...s,
      points: s.points.map(p => ({ ...p }))
    }));
    this.emit('strokesUpdated', { strokes: this.strokes });
  }

  undoLastStroke(): Stroke | null {
    const removed = this.strokes.pop();
    if (removed) {
      this.emit('strokeUndone', { stroke: removed });
    }
    return removed || null;
  }

  parseRawEvents(events: RawInputEvent[], color: string, baseWidth: number): Stroke[] {
    if (events.length === 0) return [];

    const parsedStrokes: Stroke[] = [];
    let currentPoints: Point[] = [];
    let strokeStartTime = events[0].timestamp;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: event.pressure ?? 0.5,
        timestamp: event.timestamp,
        velocity: 0
      };

      if (i > 0) {
        point.velocity = calculateVelocity([...currentPoints, point], currentPoints.length);
        point.pressure = calculatePressure(point.velocity, event.pressure);
      }

      const timeSinceLast = i > 0 ? event.timestamp - events[i - 1].timestamp : 0;
      if (timeSinceLast > 500 && currentPoints.length > 0) {
        parsedStrokes.push({
          id: generateId(),
          points: currentPoints,
          color,
          baseWidth,
          startTime: strokeStartTime,
          endTime: events[i - 1].timestamp
        });
        currentPoints = [];
        strokeStartTime = event.timestamp;
      }

      currentPoints.push(point);
    }

    if (currentPoints.length > 0) {
      parsedStrokes.push({
        id: generateId(),
        points: currentPoints,
        color,
        baseWidth,
        startTime: strokeStartTime,
        endTime: events[events.length - 1].timestamp
      });
    }

    parsedStrokes.forEach(stroke => {
      for (let i = 0; i < stroke.points.length; i++) {
        stroke.points[i] = smoothPoint(stroke.points, i, SMOOTHING_WINDOW);
      }
    });

    return parsedStrokes;
  }

  getStrokeBounds(stroke: Stroke): { minX: number; maxX: number; minY: number; maxY: number } {
    if (stroke.points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    stroke.points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    return { minX, maxX, minY, maxY };
  }

  getAllBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    if (this.strokes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.strokes.forEach(stroke => {
      const bounds = this.getStrokeBounds(stroke);
      minX = Math.min(minX, bounds.minX);
      maxX = Math.max(maxX, bounds.maxX);
      minY = Math.min(minY, bounds.minY);
      maxY = Math.max(maxY, bounds.maxY);
    });

    return { minX, maxX, minY, maxY };
  }
}

export default StrokeAnalyzer;
