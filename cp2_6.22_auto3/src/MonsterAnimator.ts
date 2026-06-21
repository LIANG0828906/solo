import { PathManager } from './PathManager';

interface TrailPoint {
  x: number;
  y: number;
}

export interface MonsterState {
  x: number;
  y: number;
  speed: number;
  currentFromId: number | null;
  currentToId: number | null;
  progress: number;
}

export class MonsterAnimator {
  private pathManager: PathManager;
  private x: number = 0;
  private y: number = 0;
  private speed: number = 100;
  private trail: TrailPoint[] = [];
  private maxTrailLength: number = 7;
  private currentFromId: number | null = null;
  private currentToId: number | null = null;
  private progress: number = 0;
  private active: boolean = false;
  private radius: number = 10;

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  getSpeed(): number {
    return this.speed;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getState(): MonsterState {
    return {
      x: this.x,
      y: this.y,
      speed: this.speed,
      currentFromId: this.currentFromId,
      currentToId: this.currentToId,
      progress: this.progress
    };
  }

  start(): void {
    const startId = this.pathManager.getStartNodeId();
    if (startId === null) return;

    const startNode = this.pathManager.getNode(startId);
    if (!startNode) return;

    this.x = startNode.x;
    this.y = startNode.y;
    this.trail = [];
    this.currentFromId = startId;
    this.progress = 0;

    const nextId = this.pathManager.selectBranchChild(startId);
    if (nextId !== null) {
      this.currentToId = nextId;
      this.active = true;
    } else {
      this.currentToId = null;
      this.active = false;
    }
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  reset(): void {
    this.active = false;
    this.trail = [];
    this.currentFromId = null;
    this.currentToId = null;
    this.progress = 0;
    this.x = 0;
    this.y = 0;
  }

  update(deltaTime: number): void {
    if (!this.active || this.currentFromId === null || this.currentToId === null) return;

    const segments = this.pathManager.getSegments();
    const seg = segments.find(
      s => s.fromId === this.currentFromId && s.toId === this.currentToId
    );

    if (!seg || seg.length < 1) {
      this.advanceToNextNode();
      return;
    }

    const moveDistance = this.speed * deltaTime;
    this.progress += moveDistance / seg.length;

    while (this.progress >= 1 && this.active) {
      this.progress -= 1;
      this.advanceToNextNode();
      if (!this.active) break;
    }

    if (this.active && this.currentFromId !== null && this.currentToId !== null) {
      const pos = this.pathManager.getPointOnSegment(
        this.currentFromId,
        this.currentToId,
        Math.min(this.progress, 1)
      );
      this.x = pos.x;
      this.y = pos.y;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }
  }

  private advanceToNextNode(): void {
    if (this.currentToId === null) {
      this.active = false;
      return;
    }

    this.currentFromId = this.currentToId;
    const fromNode = this.pathManager.getNode(this.currentFromId);
    if (!fromNode) {
      this.active = false;
      return;
    }

    this.x = fromNode.x;
    this.y = fromNode.y;

    if (fromNode.children.length === 0) {
      this.active = false;
      return;
    }

    const nextId = this.pathManager.selectBranchChild(this.currentFromId);
    if (nextId === null) {
      this.active = false;
      return;
    }

    this.currentToId = nextId;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawTrail(ctx);
    this.drawBody(ctx);
  }

  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    const startAlpha = 0.6;
    const endAlpha = 0.1;
    const alphaStep = (startAlpha - endAlpha) / Math.max(this.trail.length - 1, 1);

    for (let i = 0; i < this.trail.length; i++) {
      const point = this.trail[i];
      const alpha = startAlpha - alphaStep * i;
      const sizeRatio = 0.4 + 0.6 * (i / this.trail.length);
      const r = this.radius * sizeRatio;

      ctx.beginPath();
      ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160, 220, 255, ${alpha})`;
      ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  private drawBody(ctx: CanvasRenderingContext2D): void {
    if (this.currentFromId === null && this.currentToId === null) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      this.x - 2, this.y - 2, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, '#8fe8ff');
    gradient.addColorStop(0.6, '#40a0ff');
    gradient.addColorStop(1, '#2060c0');
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(100, 200, 255, 0.9)';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 3, this.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
  }
}
