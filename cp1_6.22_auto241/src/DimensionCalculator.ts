import { Point, Wall, Dimension, PIXELS_PER_METER } from './types';
import { v4 as uuidv4 } from 'uuid';

export class DimensionCalculator {
  private static readonly DIMENSION_OFFSET = 12;
  private static readonly TICK_LENGTH = 6;

  static calculateWallLength(wall: Wall): number {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static calculateWallAngle(wall: Wall): number {
    return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  }

  static pixelsToMeters(pixels: number): number {
    return pixels / PIXELS_PER_METER;
  }

  static formatDimension(pixels: number): string {
    const meters = this.pixelsToMeters(pixels);
    return meters.toFixed(1) + 'm';
  }

  static getNormalDirection(wall: Wall, rooms: { walls: string[]; points: Point[] }[], wallId: string): Point {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return { x: 0, y: -1 };

    const nx = -dy / len;
    const ny = dx / len;

    let insideCount = 0;
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    const testX = midX + nx * 10;
    const testY = midY + ny * 10;

    for (const room of rooms) {
      if (room.walls.includes(wallId)) {
        if (this.isPointInPolygon(testX, testY, room.points)) {
          insideCount++;
        }
      }
    }

    if (insideCount > 0) {
      return { x: -nx, y: -ny };
    }
    return { x: nx, y: ny };
  }

  private static isPointInPolygon(px: number, py: number, points: Point[]): boolean {
    if (points.length < 3) return false;

    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  static calculateDimension(
    wall: Wall,
    wallId: string,
    normal: Point
  ): Dimension {
    const offset = this.DIMENSION_OFFSET;
    const tickLen = this.TICK_LENGTH;

    const startPoint = {
      x: wall.start.x + normal.x * offset,
      y: wall.start.y + normal.y * offset
    };
    const endPoint = {
      x: wall.end.x + normal.x * offset,
      y: wall.end.y + normal.y * offset
    };

    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;

    const length = this.calculateWallLength(wall);
    const text = this.formatDimension(length);

    const perpX = -normal.y;
    const perpY = normal.x;

    const textPosition = {
      x: midX + perpX * 8,
      y: midY + perpY * 8
    };

    return {
      id: uuidv4(),
      wallId,
      startPoint,
      endPoint,
      text,
      textPosition,
      offset
    };
  }

  static calculateDimensionsForWalls(
    walls: Wall[],
    rooms: { walls: string[]; points: Point[] }[]
  ): Dimension[] {
    const dimensions: Dimension[] = [];
    
    for (const wall of walls) {
      const normal = this.getNormalDirection(wall, rooms, wall.id);
      const dimension = this.calculateDimension(wall, wall.id, normal);
      dimensions.push(dimension);
    }
    
    return dimensions;
  }

  static getPointAlongWall(wall: Wall, position: number): Point {
    return {
      x: wall.start.x + (wall.end.x - wall.start.x) * position,
      y: wall.start.y + (wall.end.y - wall.start.y) * position
    };
  }

  static getWallDirection(wall: Wall): Point {
    const length = this.calculateWallLength(wall);
    if (length === 0) return { x: 1, y: 0 };
    return {
      x: (wall.end.x - wall.start.x) / length,
      y: (wall.end.y - wall.start.y) / length
    };
  }

  static getWallPerpendicular(wall: Wall): Point {
    const dir = this.getWallDirection(wall);
    return { x: -dir.y, y: dir.x };
  }

  static distanceToPoint(wall: Wall, point: Point): number {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) {
      const distX = point.x - wall.start.x;
      const distY = point.y - wall.start.y;
      return Math.sqrt(distX * distX + distY * distY);
    }
    
    let t = ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    
    const projX = wall.start.x + t * dx;
    const projY = wall.start.y + t * dy;
    
    const distX = point.x - projX;
    const distY = point.y - projY;
    
    return Math.sqrt(distX * distX + distY * distY);
  }

  static getPositionAlongWall(wall: Wall, point: Point): number {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) return 0;
    
    let t = ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / lenSq;
    return Math.max(0, Math.min(1, t));
  }

  static snapToGrid(point: Point, gridSize: number): Point {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }
}
