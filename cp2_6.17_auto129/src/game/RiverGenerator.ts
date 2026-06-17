import { v4 as uuidv4 } from 'uuid';
import { Position, RiverSegment, Obstacle, Coin } from '../store/gameStore';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SEGMENT_LENGTH = 450;
const INITIAL_RIVER_WIDTH = 600;
const MIN_RIVER_WIDTH = 300;

export class RiverGenerator {
  private bendOffset: number = 80;
  private maxBendOffset: number = 200;
  private lastEndPoint: Position = { x: CANVAS_WIDTH / 2, y: 0 };
  private lastEndAngle: number = 0;

  constructor() {}

  setBendOffset(offset: number): void {
    this.bendOffset = Math.min(offset, this.maxBendOffset);
  }

  generateSegment(): RiverSegment {
    const startPoint = { ...this.lastEndPoint };
    const startAngle = this.lastEndAngle;

    const bendDirection = Math.random() > 0.5 ? 1 : -1;
    const bendAmount = this.bendOffset * (0.3 + Math.random() * 0.7);

    const cp1Offset = this.bendOffset * 0.5 * (Math.random() - 0.5) * 2;
    const cp2Offset = bendDirection * bendAmount + this.bendOffset * 0.3 * (Math.random() - 0.5) * 2;

    const controlPoint1: Position = {
      x: startPoint.x + Math.sin(startAngle) * SEGMENT_LENGTH * 0.3 + cp1Offset,
      y: startPoint.y - Math.cos(startAngle) * SEGMENT_LENGTH * 0.3,
    };

    const controlPoint2: Position = {
      x: startPoint.x + Math.sin(startAngle) * SEGMENT_LENGTH * 0.7 + cp2Offset,
      y: startPoint.y - Math.cos(startAngle) * SEGMENT_LENGTH * 0.7,
    };

    const dx = controlPoint2.x - controlPoint1.x;
    const dy = controlPoint2.y - controlPoint1.y;
    const endAngle = Math.atan2(dx, -dy) + (Math.random() - 0.5) * 0.3;

    const endPoint: Position = {
      x: controlPoint2.x + Math.sin(endAngle) * SEGMENT_LENGTH * 0.3,
      y: controlPoint2.y - Math.cos(endAngle) * SEGMENT_LENGTH * 0.3,
    };

    const riverWidth = Math.max(MIN_RIVER_WIDTH, INITIAL_RIVER_WIDTH - (startPoint.y / CANVAS_HEIGHT) * (INITIAL_RIVER_WIDTH - MIN_RIVER_WIDTH));

    this.lastEndPoint = { ...endPoint };
    this.lastEndAngle = endAngle;

    return {
      startPoint,
      controlPoint1,
      controlPoint2,
      endPoint,
      width: riverWidth,
    };
  }

  getPointOnBezier(segment: RiverSegment, t: number): Position {
    const { startPoint, controlPoint1, controlPoint2, endPoint } = segment;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * startPoint.x + 3 * mt2 * t * controlPoint1.x + 3 * mt * t2 * controlPoint2.x + t3 * endPoint.x,
      y: mt3 * startPoint.y + 3 * mt2 * t * controlPoint1.y + 3 * mt * t2 * controlPoint2.y + t3 * endPoint.y,
    };
  }

  getTangentOnBezier(segment: RiverSegment, t: number): Position {
    const { startPoint, controlPoint1, controlPoint2, endPoint } = segment;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;

    return {
      x: 3 * mt2 * (controlPoint1.x - startPoint.x) + 6 * mt * t * (controlPoint2.x - controlPoint1.x) + 3 * t2 * (endPoint.x - controlPoint2.x),
      y: 3 * mt2 * (controlPoint1.y - startPoint.y) + 6 * mt * t * (controlPoint2.y - controlPoint1.y) + 3 * t2 * (endPoint.y - controlPoint2.y),
    };
  }

  getNormalOnBezier(segment: RiverSegment, t: number): Position {
    const tangent = this.getTangentOnBezier(segment, t);
    const len = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
    return {
      x: -tangent.y / len,
      y: tangent.x / len,
    };
  }

  generateObstaclesForSegment(segment: RiverSegment, gameTime: number, speedMultiplier: number): Obstacle[] {
    const obstacles: Obstacle[] = [];
    const density = 0.5 + speedMultiplier * 0.3;
    const numObstacles = Math.floor(2 + Math.random() * 3 * density);

    for (let i = 0; i < numObstacles; i++) {
      const t = 0.2 + (i / numObstacles) * 0.6 + (Math.random() - 0.5) * 0.1;
      const centerPoint = this.getPointOnBezier(segment, t);
      const normal = this.getNormalOnBezier(segment, t);
      const offset = (Math.random() - 0.5) * (segment.width - 80);

      const type: 'rock' | 'driftwood' = Math.random() > 0.5 ? 'rock' : 'driftwood';

      obstacles.push({
        id: uuidv4(),
        type,
        position: {
          x: centerPoint.x + normal.x * offset,
          y: centerPoint.y + normal.y * offset,
        },
        rotation: Math.random() * Math.PI * 2,
      });
    }

    return obstacles;
  }

  generateCoinsForSegment(segment: RiverSegment, gameTime: number, speedMultiplier: number): Coin[] {
    const coins: Coin[] = [];
    const density = 0.6 + speedMultiplier * 0.4;
    const numCoins = Math.floor(3 + Math.random() * 5 * density);

    for (let i = 0; i < numCoins; i++) {
      const t = 0.15 + (i / numCoins) * 0.7 + (Math.random() - 0.5) * 0.05;
      const centerPoint = this.getPointOnBezier(segment, t);
      const normal = this.getNormalOnBezier(segment, t);
      const offset = (Math.random() - 0.5) * (segment.width - 100);

      coins.push({
        id: uuidv4(),
        position: {
          x: centerPoint.x + normal.x * offset,
          y: centerPoint.y + normal.y * offset,
        },
        rotation: 0,
        scale: 1,
        collected: false,
      });
    }

    return coins;
  }

  reset(): void {
    this.lastEndPoint = { x: CANVAS_WIDTH / 2, y: 0 };
    this.lastEndAngle = 0;
  }
}
