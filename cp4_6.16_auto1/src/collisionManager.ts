export interface Point {
  x: number;
  y: number;
}

export interface CarState {
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  speed: number;
}

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  type: 'barrier' | 'cone' | 'pillar';
}

export interface CollisionEvent {
  type: 'track_boundary' | 'obstacle' | 'car';
  impactPoint: Point;
  impactForce: number;
  timestamp: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class CollisionManager {
  private trackOuterBoundary: Point[] = [];
  private trackInnerBoundary: Point[] = [];
  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];
  private onCollisionCallbacks: ((event: CollisionEvent) => void) | null = null;
  private sparkParticles: Particle[] = [];
  private screenFlashAlpha: number = 0;

  constructor() {
    this.onCollisionCallbacks = () => {};
  }

  setTrackBoundaries(outer: Point[], inner: Point[]): void {
    this.trackOuterBoundary = outer;
    this.trackInnerBoundary = inner;
  }

  setObstacles(obstacles: Obstacle[]): void {
    this.obstacles = obstacles;
  }

  onCollision(callback: (event: CollisionEvent) => void): void {
    this.onCollisionCallbacks = callback;
  }

  checkCarCollision(car: CarState, deltaTime: number): { collided: boolean; newSpeed: number; positionPenalty: number } {
    let collided = false;
    let speedPenalty = 0;
    let positionPenalty = 0;
    const carCorners = this.getCarCorners(car);
    for (const corner of carCorners) {
      const boundaryCollision = this.checkPointAgainstBoundaries(corner);
      if (boundaryCollision.collided) {
        collided = true;
        const force = Math.abs(car.speed) / 200;
        speedPenalty = Math.max(speedPenalty, car.speed * 0.4);
        positionPenalty = 0.5;
        this.createSparks(boundaryCollision.point, force);
        this.triggerScreenFlash(0.6);
        if (this.onCollisionCallbacks) {
          this.onCollisionCallbacks({
            type: 'track_boundary',
            impactPoint: boundaryCollision.point,
            impactForce: force,
            timestamp: performance.now()
          });
        }
        break;
      }
    }
    for (const obstacle of this.obstacles) {
      const obstacleCollision = this.checkCarAgainstObstacle(car, obstacle);
      if (obstacleCollision.collided) {
        collided = true;
        const force = Math.abs(car.speed) / 150;
        speedPenalty = Math.max(speedPenalty, car.speed * 0.5);
        positionPenalty = 0.5;
        this.createSparks(obstacleCollision.point, force);
        this.triggerScreenFlash(0.8);
        if (this.onCollisionCallbacks) {
          this.onCollisionCallbacks({
            type: 'obstacle',
            impactPoint: obstacleCollision.point,
            impactForce: force,
            timestamp: performance.now()
          });
        }
        break;
      }
    }
    return {
      collided,
      newSpeed: Math.max(0, car.speed - speedPenalty),
      positionPenalty
    };
  }

  private getCarCorners(car: CarState): Point[] {
    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);
    const hw = car.width / 2;
    const hh = car.height / 2;
    return [
      { x: car.x + cos * hw - sin * hh, y: car.y + sin * hw + cos * hh },
      { x: car.x + cos * hw + sin * hh, y: car.y + sin * hw - cos * hh },
      { x: car.x - cos * hw - sin * hh, y: car.y - sin * hw + cos * hh },
      { x: car.x - cos * hw + sin * hh, y: car.y - sin * hw - cos * hh }
    ];
  }

  private checkPointAgainstBoundaries(point: Point): { collided: boolean; point: Point } {
    const insideOuter = this.isPointInsidePolygon(point, this.trackOuterBoundary);
    const insideInner = this.isPointInsidePolygon(point, this.trackInnerBoundary);
    if (!insideOuter) {
      return { collided: true, point: this.findNearestBoundaryPoint(point, this.trackOuterBoundary) };
    }
    if (insideInner && this.trackInnerBoundary.length > 2) {
      return { collided: true, point: this.findNearestBoundaryPoint(point, this.trackInnerBoundary) };
    }
    return { collided: false, point: { x: 0, y: 0 } };
  }

  private isPointInsidePolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return true;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private findNearestBoundaryPoint(point: Point, polygon: Point[]): Point {
    let nearest = polygon[0] || { x: 0, y: 0 };
    let minDist = Infinity;
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      const closest = this.closestPointOnSegment(point, p1, p2);
      const dist = this.distance(point, closest);
      if (dist < minDist) {
        minDist = dist;
        nearest = closest;
      }
    }
    return nearest;
  }

  private closestPointOnSegment(p: Point, a: Point, b: Point): Point {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const abLenSq = ab.x * ab.x + ab.y * ab.y;
    if (abLenSq === 0) return { x: a.x, y: a.y };
    let t = (ap.x * ab.x + ap.y * ab.y) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: a.x + t * ab.x, y: a.y + t * ab.y };
  }

  private checkCarAgainstObstacle(car: CarState, obstacle: Obstacle): { collided: boolean; point: Point } {
    const dx = car.x - obstacle.x;
    const dy = car.y - obstacle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const carRadius = Math.max(car.width, car.height) / 2;
    if (dist < carRadius + obstacle.radius) {
      const angle = Math.atan2(dy, dx);
      return {
        collided: true,
        point: {
          x: obstacle.x + Math.cos(angle) * obstacle.radius,
          y: obstacle.y + Math.sin(angle) * obstacle.radius
        }
      };
    }
    return { collided: false, point: { x: 0, y: 0 } };
  }

  private distance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private createSparks(position: Point, force: number): void {
    const count = Math.floor(8 + force * 15);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 4) * (0.5 + force);
      const colors = ['#ffaa00', '#ff6600', '#ff3300', '#ffff00', '#ffffff'];
      this.sparkParticles.push({
        x: position.x + (Math.random() - 0.5) * 6,
        y: position.y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3
      });
    }
  }

  private triggerScreenFlash(intensity: number): void {
    this.screenFlashAlpha = Math.max(this.screenFlashAlpha, intensity);
  }

  updateParticles(deltaTime: number): void {
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const p = this.sparkParticles[i];
      p.life += deltaTime;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life >= p.maxLife) {
        this.sparkParticles.splice(i, 1);
      }
    }
    this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - deltaTime * 2);
  }

  getSparkParticles(): Particle[] {
    return this.sparkParticles;
  }

  getScreenFlashAlpha(): number {
    return this.screenFlashAlpha;
  }

  getObstacles(): Obstacle[] {
    return [...this.obstacles];
  }

  reset(): void {
    this.sparkParticles = [];
    this.screenFlashAlpha = 0;
  }
}

export class FinishLineDetector {
  private startPoint: Point;
  private endPoint: Point;
  private direction: Point;
  private normal: Point;

  constructor(start: Point, end: Point) {
    this.startPoint = start;
    this.endPoint = end;
    this.direction = { x: end.x - start.x, y: end.y - start.y };
    const len = Math.sqrt(this.direction.x ** 2 + this.direction.y ** 2);
    this.normal = { x: -this.direction.y / len, y: -this.direction.x / len };
  }

  checkCrossing(prevPos: Point, currPos: Point): boolean {
    const prevSide = this.sideOfLine(prevPos);
    const currSide = this.sideOfLine(currPos);
    return prevSide !== 0 && currSide !== 0 && prevSide !== currSide;
  }

  private sideOfLine(point: Point): number {
    return (
      (this.endPoint.x - this.startPoint.x) * (point.y - this.startPoint.y) -
      (this.endPoint.y - this.startPoint.y) * (point.x - this.startPoint.x)
    );
  }

  getStartPoint(): Point {
    return { x: this.startPoint.x, y: this.startPoint.y };
  }

  getEndPoint(): Point {
    return { x: this.endPoint.x, y: this.endPoint.y };
  }
}
