import type { WindParams } from './wind';
import type { ShootParams } from './archer';

interface TrailParticle {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  startAlpha: number;
  life: number;
  maxLife: number;
}

export interface HitResult {
  hit: boolean;
  score: number;
  hitX: number;
  hitY: number;
}

const COLORS = {
  ARROW_SHAFT: '#3A2512',
  ARROW_TIP: '#AAAAAA',
  ARROW_FLETCHING: '#FFFFFF',
  TRAIL_START: '#CCCCCC',
  TRAIL_END: '#EEEEEE'
};

const MAX_PARTICLES = 200;
const PARTICLES_PER_FRAME = 3;
const TRAIL_LIFE = 16;
const GRAVITY = 0.12;
const AIR_RESISTANCE = 0.9985;

export class Arrow {
  private flying: boolean = false;
  private x: number = 0;
  private y: number = 0;
  private vx: number = 0;
  private vy: number = 0;
  private angle: number = 0;
  private wind: WindParams = { angle: 0, level: 0, offsetPerFrame: 0 };
  private trail: TrailParticle[] = [];
  private targetReached: boolean = false;
  private finalX: number = 0;
  private finalY: number = 0;
  private frameCount: number = 0;

  launch(params: ShootParams, wind: WindParams): void {
    this.flying = true;
    this.targetReached = false;
    this.frameCount = 0;
    this.x = params.startX;
    this.y = params.startY;
    const sp = params.initialSpeed;
    this.vx = Math.cos(params.angle) * sp;
    this.vy = Math.sin(params.angle) * sp;
    this.angle = params.angle;
    this.wind = { ...wind };
    this.trail = [];
  }

  update(): boolean {
    if (!this.flying) return false;
    this.frameCount++;

    const windRad = (this.wind.angle * Math.PI) / 180;
    const windX = Math.sin(windRad) * this.wind.offsetPerFrame;
    const windY = -Math.cos(windRad) * this.wind.offsetPerFrame * 0.1;

    this.vx = (this.vx + windX * 0.08) * AIR_RESISTANCE;
    this.vy = (this.vy + windY * 0.08 + GRAVITY) * AIR_RESISTANCE;
    this.x += this.vx;
    this.y += this.vy;
    this.angle = Math.atan2(this.vy, this.vx);

    this.spawnParticles();
    this.updateParticles();

    if (this.frameCount > 4 && this.vx > 0) {
      const candidateTargetX = this.finalX;
      const dx = Math.abs(this.x - candidateTargetX);
      if (dx < Math.abs(this.vx) * 1.5 && this.x >= candidateTargetX) {
        this.targetReached = true;
      }
    }

    if (this.y > 2000 || this.x > 3000 || this.x < -500) {
      this.finalX = this.x;
      this.finalY = this.y;
      this.flying = false;
      return false;
    }

    return true;
  }

  setTargetPlane(targetX: number): void {
    this.finalX = targetX;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawTrail(ctx);
    if (this.flying || this.targetReached) {
      this.drawArrow(ctx);
    }
  }

  private drawArrow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.strokeStyle = COLORS.ARROW_SHAFT;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();

    ctx.fillStyle = COLORS.ARROW_TIP;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(18, -5);
    ctx.lineTo(18, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = COLORS.ARROW_FLETCHING;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-36, -7);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-36, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#DD2222';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  private drawTrail(ctx: CanvasRenderingContext2D): void {
    for (const p of this.trail) {
      const t = 1 - p.life / p.maxLife;
      const currentR = p.radius + (p.maxRadius - p.radius) * t;
      const alpha = p.startAlpha * (1 - t);
      const r = Math.floor(204 + (238 - 204) * t);
      const g = Math.floor(204 + (238 - 204) * t);
      const b = Math.floor(204 + (238 - 204) * t);

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
      ctx.restore();
    }
  }

  private spawnParticles(): void {
    const maxCount = Math.min(MAX_PARTICLES - this.trail.length, PARTICLES_PER_FRAME);
    for (let i = 0; i < maxCount; i++) {
      const offset = (i / PARTICLES_PER_FRAME) * 10;
      const backAngle = this.angle + Math.PI;
      const px = this.x + Math.cos(backAngle) * offset + (Math.random() - 0.5) * 1.5;
      const py = this.y + Math.sin(backAngle) * offset + (Math.random() - 0.5) * 1.5;
      this.trail.push({
        x: px,
        y: py,
        radius: 1.5,
        maxRadius: 3 + Math.random() * 1.5,
        alpha: 0,
        startAlpha: 0.65 + Math.random() * 0.2,
        life: TRAIL_LIFE + Math.floor(Math.random() * 4),
        maxLife: TRAIL_LIFE + 4
      });
    }
  }

  private updateParticles(): void {
    this.trail = this.trail.filter(p => {
      p.life--;
      return p.life > 0;
    });
  }

  checkHit(targetX: number, targetY: number, targetRadius: number): HitResult {
    const finalX = this.targetReached ? this.x : this.finalX;
    const finalY = this.targetReached ? this.y : this.finalY;

    const dx = finalX - targetX;
    const dy = finalY - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.flying) {
      if (Math.abs(this.x - targetX) <= Math.max(Math.abs(this.vx) * 1.2, 2)) {
        if (dist <= targetRadius + 8) {
          this.flying = false;
          this.finalX = targetX + (this.vx > 0 ? Math.min(dx, targetRadius) : Math.max(dx, -targetRadius));
          this.finalY = this.y;
          return {
            hit: true,
            score: 0,
            hitX: this.finalX,
            hitY: this.finalY
          };
        }
      }
    }

    if (this.targetReached) {
      this.flying = false;
      if (dist <= targetRadius + 10) {
        return {
          hit: true,
          score: 0,
          hitX: finalX,
          hitY: finalY
        };
      }
    }

    return {
      hit: false,
      score: 0,
      hitX: finalX,
      hitY: finalY
    };
  }

  isFlying(): boolean {
    return this.flying;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
