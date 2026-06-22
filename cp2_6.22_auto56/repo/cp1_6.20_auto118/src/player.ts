import { Rect, rectsOverlap } from './level';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class Player {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number = 24;
  height: number = 24;
  onGround: boolean = false;
  jumpsLeft: number = 2;
  readonly maxJumps: number = 2;
  readonly moveSpeed: number = 240;
  readonly jumpForce: number = 480;
  readonly gravity: number = 1200;
  readonly maxFallSpeed: number = 800;
  private particles: Particle[] = [];
  private wasOnGround: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.wasOnGround = false;
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpsLeft = this.maxJumps;
    this.particles = [];
    this.wasOnGround = false;
  }

  getRect(): Rect {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  handleInput(input: { left: boolean; right: boolean; jump: boolean; jumpPressed: boolean }): void {
    if (input.left && !input.right) {
      this.vx = -this.moveSpeed;
    } else if (input.right && !input.left) {
      this.vx = this.moveSpeed;
    } else {
      this.vx = 0;
    }

    if (input.jumpPressed && this.jumpsLeft > 0) {
      this.vy = -this.jumpForce;
      this.jumpsLeft--;
      this.onGround = false;
    }
  }

  update(dt: number, solids: Rect[]): void {
    this.wasOnGround = this.onGround;

    this.vy += this.gravity * dt;
    if (this.vy > this.maxFallSpeed) {
      this.vy = this.maxFallSpeed;
    }

    this.x += this.vx * dt;
    this.resolveCollisions(solids, 'horizontal');

    this.y += this.vy * dt;
    this.onGround = false;
    this.resolveCollisions(solids, 'vertical');

    if (this.onGround && !this.wasOnGround && this.vy >= 0) {
      this.spawnLandParticles();
    }

    if (this.onGround) {
      this.jumpsLeft = this.maxJumps;
    }

    this.updateParticles(dt);
  }

  private resolveCollisions(solids: Rect[], axis: 'horizontal' | 'vertical'): void {
    const playerRect = this.getRect();

    for (const solid of solids) {
      if (!rectsOverlap(playerRect, solid)) continue;

      if (axis === 'horizontal') {
        if (this.vx > 0) {
          this.x = solid.x - this.width;
        } else if (this.vx < 0) {
          this.x = solid.x + solid.width;
        }
        this.vx = 0;
      } else {
        if (this.vy > 0) {
          this.y = solid.y - this.height;
          this.onGround = true;
          this.vy = 0;
        } else if (this.vy < 0) {
          this.y = solid.y + solid.height;
          this.vy = 0;
        }
      }

      playerRect.x = this.x;
      playerRect.y = this.y;
    }
  }

  private spawnLandParticles(): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.2,
        size: 2 + Math.random() * 3,
        color: '#b0b0b0',
      });
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;

    const gradient = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, r);
    gradient.addColorStop(0, '#6ab7ff');
    gradient.addColorStop(1, '#2a7dd9');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, Math.PI * 1.2, Math.PI * 1.7);
    ctx.stroke();
  }

  drawCollisionBox(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
    ctx.setLineDash([]);
  }
}
