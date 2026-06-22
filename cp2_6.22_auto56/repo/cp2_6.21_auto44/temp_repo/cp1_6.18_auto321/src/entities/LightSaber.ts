import Phaser from 'phaser';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  timestamp: number;
}

export interface SaberState {
  x: number;
  y: number;
  angle: number;
  length: number;
  color: number;
  trail: TrailPoint[];
}

export class LightSaber {
  private state: SaberState;
  private lastCutPosition: { x: number; y: number } | null = null;
  private readonly trailDuration = 100;
  private readonly arcRadius = 1.2;
  private readonly minAngle = -Math.PI / 2;
  private readonly maxAngle = Math.PI / 2;
  private readonly hitDistance = 0.5;

  constructor(x: number, y: number) {
    this.state = {
      x,
      y,
      angle: 0,
      length: 1.2,
      color: 0x00bfff,
      trail: [],
    };
  }

  update(
    deltaTime: number,
    mouseX: number,
    mouseY: number,
    isDragging: boolean
  ): void {
    if (isDragging) {
      const dx = mouseX - this.state.x;
      const dy = mouseY - this.state.y;
      let targetAngle = Math.atan2(dy, dx);

      targetAngle = Phaser.Math.Clamp(
        targetAngle,
        this.minAngle,
        this.maxAngle
      );

      this.state.angle = Phaser.Math.Linear(
        this.state.angle,
        targetAngle,
        0.3
      );

      const tipPos = this.getTipPosition();
      this.lastCutPosition = { x: tipPos.x, y: tipPos.y };

      this.state.trail.push({
        x: tipPos.x,
        y: tipPos.y,
        alpha: 1,
        scale: 1,
        timestamp: Date.now(),
      });
    }

    const now = Date.now();
    this.state.trail = this.state.trail.filter(
      (point) => now - point.timestamp < this.trailDuration
    );

    for (const point of this.state.trail) {
      const age = now - point.timestamp;
      const progress = age / this.trailDuration;
      point.alpha = 1 - progress;
      point.scale = 1 - progress * 0.5;
    }
  }

  getTipPosition(): { x: number; y: number } {
    return {
      x: this.state.x + Math.cos(this.state.angle) * this.state.length,
      y: this.state.y + Math.sin(this.state.angle) * this.state.length,
    };
  }

  checkCollision(
    noteX: number,
    noteY: number,
    noteZ: number,
    noteSize: number
  ): boolean {
    const tipPos = this.getTipPosition();
    const saberPoints = this.getSaberPoints();

    for (const point of saberPoints) {
      const dx = point.x - noteX;
      const dy = point.y - noteY;
      const dz = 0 - noteZ;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < this.hitDistance + noteSize * 0.5) {
        return true;
      }
    }

    return false;
  }

  private getSaberPoints(): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const segments = 5;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push({
        x: this.state.x + Math.cos(this.state.angle) * this.state.length * t,
        y: this.state.y + Math.sin(this.state.angle) * this.state.length * t,
      });
    }

    return points;
  }

  getLastCutPosition(): { x: number; y: number } | null {
    return this.lastCutPosition;
  }

  getState(): SaberState {
    return { ...this.state, trail: [...this.state.trail] };
  }

  render(graphics: Phaser.GameObjects.Graphics): void {
    for (let i = 0; i < this.state.trail.length; i++) {
      const point = this.state.trail[i];
      const trailLength = this.state.length * point.scale;

      graphics.lineStyle(4 * point.scale, this.state.color, point.alpha * 0.5);
      graphics.beginPath();
      graphics.moveTo(this.state.x, this.state.y);
      graphics.lineTo(
        this.state.x + (point.x - this.state.x) * point.scale,
        this.state.y + (point.y - this.state.y) * point.scale
      );
      graphics.strokePath();
    }

    const tipPos = this.getTipPosition();

    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.beginPath();
    graphics.moveTo(this.state.x, this.state.y);
    graphics.lineTo(tipPos.x, tipPos.y);
    graphics.strokePath();

    graphics.lineStyle(6, this.state.color, 1);
    graphics.beginPath();
    graphics.moveTo(this.state.x, this.state.y);
    graphics.lineTo(tipPos.x, tipPos.y);
    graphics.strokePath();

    graphics.lineStyle(12, this.state.color, 0.3);
    graphics.beginPath();
    graphics.moveTo(this.state.x, this.state.y);
    graphics.lineTo(tipPos.x, tipPos.y);
    graphics.strokePath();

    graphics.fillStyle(this.state.color, 1);
    graphics.fillCircle(tipPos.x, tipPos.y, 4);

    graphics.fillStyle(this.state.color, 0.4);
    graphics.fillCircle(tipPos.x, tipPos.y, 10);
  }
}
