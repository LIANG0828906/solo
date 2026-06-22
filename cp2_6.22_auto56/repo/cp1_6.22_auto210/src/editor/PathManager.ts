import { PathPoint } from '../types';

export class PathManager {
  private points: PathPoint[] = [];

  constructor(points: PathPoint[] = []) {
    this.points = this.clonePoints(points);
  }

  private clonePoints(points: PathPoint[]): PathPoint[] {
    return points.map(p => ({
      x: p.x,
      y: p.y,
      handleIn: p.handleIn ? { ...p.handleIn } : undefined,
      handleOut: p.handleOut ? { ...p.handleOut } : undefined
    }));
  }

  setPoints(points: PathPoint[]): void {
    this.points = this.clonePoints(points);
  }

  getPoints(): PathPoint[] {
    return this.clonePoints(this.points);
  }

  addPoint(x: number, y: number): PathPoint[] {
    const newPoint: PathPoint = { x, y };
    const points = this.getPoints();

    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;

      if (!lastPoint.handleOut) {
        lastPoint.handleOut = {
          x: lastPoint.x + dx * 0.3,
          y: lastPoint.y + dy * 0.3
        };
      }

      newPoint.handleIn = {
        x: x - dx * 0.3,
        y: y - dy * 0.3
      };
    }

    points.push(newPoint);
    this.setPoints(points);
    return this.getPoints();
  }

  removePoint(index: number): PathPoint[] {
    const points = this.getPoints();
    if (index < 0 || index >= points.length) {
      return points;
    }

    points.splice(index, 1);
    this.setPoints(points);
    return this.getPoints();
  }

  updatePoint(index: number, updates: Partial<PathPoint>): PathPoint[] {
    const points = this.getPoints();
    if (index < 0 || index >= points.length) {
      return points;
    }

    const point = points[index];

    if (updates.x !== undefined && updates.y !== undefined) {
      const dx = updates.x - point.x;
      const dy = updates.y - point.y;

      if (point.handleIn) {
        point.handleIn = {
          x: point.handleIn.x + dx,
          y: point.handleIn.y + dy
        };
      }
      if (point.handleOut) {
        point.handleOut = {
          x: point.handleOut.x + dx,
          y: point.handleOut.y + dy
        };
      }

      point.x = updates.x;
      point.y = updates.y;
    }

    if (updates.handleIn !== undefined) {
      point.handleIn = updates.handleIn ? { ...updates.handleIn } : undefined;
      if (point.handleIn && index > 0) {
        this.syncHandleOutForPrevious(points, index);
      }
    }

    if (updates.handleOut !== undefined) {
      point.handleOut = updates.handleOut ? { ...updates.handleOut } : undefined;
      if (point.handleOut && index < points.length - 1) {
        this.syncHandleInForNext(points, index);
      }
    }

    this.setPoints(points);
    return this.getPoints();
  }

  private syncHandleOutForPrevious(points: PathPoint[], index: number): void {
    if (index <= 0) return;
    const current = points[index];
    const prev = points[index - 1];

    if (current.handleIn) {
      const dx = current.x - current.handleIn.x;
      const dy = current.y - current.handleIn.y;
      prev.handleOut = {
        x: current.x + dx,
        y: current.y + dy
      };
    }
  }

  private syncHandleInForNext(points: PathPoint[], index: number): void {
    if (index >= points.length - 1) return;
    const current = points[index];
    const next = points[index + 1];

    if (current.handleOut) {
      const dx = current.x - current.handleOut.x;
      const dy = current.y - current.handleOut.y;
      next.handleIn = {
        x: current.x + dx,
        y: current.y + dy
      };
    }
  }

  serialize(): string {
    const points = this.getPoints();
    if (points.length === 0) return '';

    let pathStr = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      if (prev.handleOut || curr.handleIn) {
        const cp1 = prev.handleOut || { x: prev.x, y: prev.y };
        const cp2 = curr.handleIn || { x: curr.x, y: curr.y };
        pathStr += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${curr.x} ${curr.y}`;
      } else {
        pathStr += ` L ${curr.x} ${curr.y}`;
      }
    }

    return pathStr;
  }

  parsePath(pathStr: string): PathPoint[] {
    const points: PathPoint[] = [];
    const commands = pathStr.match(/[MLCQSTAZ][^MLCQSTAZ]*/gi) || [];

    let currentX = 0;
    let currentY = 0;

    for (const cmd of commands) {
      const type = cmd[0].toUpperCase();
      const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

      if (type === 'M' && nums.length >= 2) {
        currentX = nums[0];
        currentY = nums[1];
        points.push({ x: currentX, y: currentY });
      } else if (type === 'L' && nums.length >= 2) {
        currentX = nums[0];
        currentY = nums[1];
        points.push({ x: currentX, y: currentY });
      } else if (type === 'C' && nums.length >= 6) {
        const cp1x = nums[0];
        const cp1y = nums[1];
        const cp2x = nums[2];
        const cp2y = nums[3];
        currentX = nums[4];
        currentY = nums[5];

        if (points.length > 0) {
          points[points.length - 1].handleOut = { x: cp1x, y: cp1y };
        }

        points.push({
          x: currentX,
          y: currentY,
          handleIn: { x: cp2x, y: cp2y }
        });
      }
    }

    return points;
  }

  getBoundingBox(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const points = this.getPoints();
    if (points.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      if (p.handleIn) {
        minX = Math.min(minX, p.handleIn.x);
        minY = Math.min(minY, p.handleIn.y);
        maxX = Math.max(maxX, p.handleIn.x);
        maxY = Math.max(maxY, p.handleIn.y);
      }
      if (p.handleOut) {
        minX = Math.min(minX, p.handleOut.x);
        minY = Math.min(minY, p.handleOut.y);
        maxX = Math.max(maxX, p.handleOut.x);
        maxY = Math.max(maxY, p.handleOut.y);
      }
    }

    return { minX, minY, maxX, maxY };
  }
}
