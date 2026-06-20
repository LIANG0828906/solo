export interface MeasurePoint {
  x: number;
  y: number;
  z: number;
}

export interface MeasurementResult {
  points: MeasurePoint[];
  distance: number | null;
}

type Listener = (result: MeasurementResult) => void;

class MeasurementTool {
  private points: MeasurePoint[] = [];
  private listeners: Set<Listener> = new Set();

  startMeasure(): void {
    this.points = [];
    this.emit();
  }

  addPoint(point: MeasurePoint): boolean {
    if (this.points.length >= 2) {
      this.points = [];
    }
    this.points.push({ ...point });
    this.emit();
    return this.points.length === 2;
  }

  getDistance(): number | null {
    if (this.points.length < 2) return null;
    const [a, b] = this.points;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100) / 100;
  }

  getResult(): MeasurementResult {
    return {
      points: [...this.points],
      distance: this.getDistance(),
    };
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const result = this.getResult();
    this.listeners.forEach((l) => l(result));
  }
}

export const measurementTool = new MeasurementTool();
