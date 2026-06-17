export interface BezierSegment {
  startOffset: number;
  cp1: number;
  cp2: number;
  endOffset: number;
  length: number;
}

export interface ObstacleData {
  id: string;
  type: 'rock' | 'driftwood';
  lateralOffset: number;
  distance: number;
  active: boolean;
  vy: number;
}

export interface CoinData {
  id: string;
  lateralOffset: number;
  distance: number;
  active: boolean;
  collected: boolean;
  collectAnimProgress: number;
  rotation: number;
}

const SEGMENT_LENGTH = 450;
const BASE_SPEED = 150;
const OBSTACLE_ROCK_RADIUS = 12;
const DRIFTWOOD_SPEED = 80;
const COIN_ROTATION_SPEED = 60;

export class RiverGenerator {
  private segments: BezierSegment[] = [];
  private obstacles: ObstacleData[] = [];
  private coins: CoinData[] = [];
  private nextId = 0;
  private cameraDistance = 0;

  constructor() {
    for (let i = 0; i < 20; i++) {
      this.addSegment(80);
    }
    this.generateObstaclesAndCoins(80);
  }

  private genId(): string {
    return String(this.nextId++);
  }

  private addSegment(maxBend: number) {
    const prevEnd = this.segments.length > 0
      ? this.segments[this.segments.length - 1].endOffset
      : 0;

    const endOffset = prevEnd + (Math.random() - 0.5) * 2 * maxBend;
    const cp1 = prevEnd + (Math.random() - 0.5) * 2 * maxBend;
    const cp2 = endOffset + (Math.random() - 0.5) * 2 * maxBend;

    this.segments.push({
      startOffset: prevEnd,
      cp1,
      cp2,
      endOffset,
      length: SEGMENT_LENGTH,
    });
  }

  private generateObstaclesAndCoins(maxBend: number) {
    const startDist = this.cameraDistance;
    const endDist = this.cameraDistance + this.getVisibleRange() + 800;

    for (let d = startDist; d < endDist; d += 200 + Math.random() * 200) {
      const segCount = this.segments.length;
      const totalDist = segCount * SEGMENT_LENGTH;
      if (d < totalDist) {
        const isRock = Math.random() > 0.4;
        this.obstacles.push({
          id: this.genId(),
          type: isRock ? 'rock' : 'driftwood',
          lateralOffset: (Math.random() - 0.5) * 0.6,
          distance: d,
          active: true,
          vy: isRock ? 0 : DRIFTWOOD_SPEED,
        });
      }
    }

    for (let d = startDist + 100; d < endDist; d += 150 + Math.random() * 150) {
      const segCount = this.segments.length;
      const totalDist = segCount * SEGMENT_LENGTH;
      if (d < totalDist) {
        this.coins.push({
          id: this.genId(),
          lateralOffset: (Math.random() - 0.5) * 0.4,
          distance: d,
          active: true,
          collected: false,
          collectAnimProgress: 0,
          rotation: 0,
        });
      }
    }
  }

  getCenterOffset(distance: number): number {
    let accumulated = 0;
    for (const seg of this.segments) {
      if (distance >= accumulated && distance < accumulated + seg.length) {
        const t = (distance - accumulated) / seg.length;
        return this.evaluateBezier(seg, t);
      }
      accumulated += seg.length;
    }
    return this.segments.length > 0 ? this.segments[this.segments.length - 1].endOffset : 0;
  }

  private evaluateBezier(seg: BezierSegment, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * seg.startOffset
      + 3 * mt * mt * t * seg.cp1
      + 3 * mt * t * t * seg.cp2
      + t * t * t * seg.endOffset;
  }

  getRiverWidth(elapsedTime: number): number {
    const minWidth = 300;
    const maxWidth = 600;
    const shrinkDuration = 120;
    const t = Math.min(elapsedTime / shrinkDuration, 1);
    return maxWidth - t * (maxWidth - minWidth);
  }

  getMaxBendOffset(elapsedTime: number): number {
    const base = 80;
    const increase = Math.floor(elapsedTime / 10) * 20;
    return Math.min(base + increase, 200);
  }

  getVisibleRange(): number {
    return 1200;
  }

  update(dt: number, cameraDistance: number, elapsedTime: number, speedMultiplier: number) {
    this.cameraDistance = cameraDistance;

    const maxBend = this.getMaxBendOffset(elapsedTime);

    const segCount = this.segments.length;
    const totalDist = segCount * SEGMENT_LENGTH;
    while (totalDist - this.cameraDistance < this.getVisibleRange() + 800) {
      this.addSegment(maxBend);
    }

    this.generateObstaclesAndCoins(maxBend);

    for (const obs of this.obstacles) {
      if (obs.type === 'driftwood' && obs.active) {
        obs.distance -= obs.vy * dt * speedMultiplier;
      }
    }

    for (const coin of this.coins) {
      if (coin.collected && coin.collectAnimProgress < 1) {
        coin.collectAnimProgress += dt / 0.3;
        if (coin.collectAnimProgress > 1) coin.collectAnimProgress = 1;
      }
      if (coin.active && !coin.collected) {
        coin.rotation += COIN_ROTATION_SPEED * dt;
      }
    }

    this.obstacles = this.obstacles.filter(
      (o) => o.active && o.distance > cameraDistance - 200
    );
    this.coins = this.coins.filter(
      (c) => c.active && (c.distance > cameraDistance - 200 || c.collectAnimProgress < 1)
    );
  }

  getObstacles(): ObstacleData[] {
    return this.obstacles;
  }

  getCoins(): CoinData[] {
    return this.coins;
  }

  reset() {
    this.segments = [];
    this.obstacles = [];
    this.coins = [];
    this.cameraDistance = 0;
    this.nextId = 0;
    for (let i = 0; i < 20; i++) {
      this.addSegment(80);
    }
    this.generateObstaclesAndCoins(80);
  }
}
