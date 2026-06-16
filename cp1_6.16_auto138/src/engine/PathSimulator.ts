import { v4 as uuidv4 } from 'uuid';
import type {
  Point2D,
  Showcase,
  VisitorStart,
  VisitorPath,
  PathPoint,
  HallConfig,
} from '../types';

export class PathSimulator {
  private hall: HallConfig;
  private showcases: Showcase[];

  constructor(hall: HallConfig, showcases: Showcase[]) {
    this.hall = hall;
    this.showcases = showcases;
  }

  async simulatePaths(starts: VisitorStart[]): Promise<VisitorPath[]> {
    const paths: VisitorPath[] = [];

    for (const start of starts) {
      for (const showcase of this.showcases) {
        const path = this.generatePath(start.position, showcase);
        paths.push(path);
      }
    }

    return paths;
  }

  private generatePath(start: Point2D, showcase: Showcase): VisitorPath {
    const points: PathPoint[] = [];
    const target = showcase.position;
    const steps = 20;
    const totalDuration = 15;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const position = this.lerpPoint(start, target, t);
      const timestamp = t * totalDuration;
      const gazeDirection = this.normalize({
        x: target.x - position.x,
        y: target.y - position.y,
      });
      const dwellTime = i === steps ? 3 : 0;

      points.push({
        position,
        timestamp,
        gazeDirection,
        dwellTime,
      });
    }

    return {
      id: uuidv4(),
      points,
      targetShowcaseId: showcase.id,
      duration: totalDuration,
    };
  }

  private lerpPoint(a: Point2D, b: Point2D, t: number): Point2D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  private normalize(v: Point2D): Point2D {
    const length = Math.sqrt(v.x * v.x + v.y * v.y);
    if (length === 0) return { x: 1, y: 0 };
    return { x: v.x / length, y: v.y / length };
  }

  updateSceneData(hall: HallConfig, showcases: Showcase[]): void {
    this.hall = hall;
    this.showcases = showcases;
  }
}
