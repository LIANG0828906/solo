export type FluidType = 'water' | 'smoke';

export interface Vec2 {
  x: number;
  y: number;
}

export class Particle {
  public pos: Vec2;
  public vel: Vec2;
  public acc: Vec2;
  public density: number = 0;
  public pressure: number = 0;
  public mass: number;
  public type: FluidType;
  public radius: number;
  public prevPos: Vec2;
  public alive: boolean = true;

  private static readonly MAX_SPEED = 500;
  private static readonly BOUND_DAMPING = 0.4;

  constructor(x: number, y: number, vx: number, vy: number, type: FluidType, radius: number = 4) {
    this.pos = { x, y };
    this.vel = { x: vx, y: vy };
    this.acc = { x: 0, y: 0 };
    this.prevPos = { x, y };
    this.type = type;
    this.radius = radius;
    this.mass = type === 'water' ? 1.0 : 0.5;
  }

  public integrate(dt: number, bounds: { width: number; height: number }): void {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;

    this.vel.x += this.acc.x * dt;
    this.vel.y += this.acc.y * dt;

    const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
    if (speed > Particle.MAX_SPEED) {
      const scale = Particle.MAX_SPEED / speed;
      this.vel.x *= scale;
      this.vel.y *= scale;
    }

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    this.acc.x = 0;
    this.acc.y = 0;

    this.checkBounds(bounds);
  }

  private checkBounds(bounds: { width: number; height: number }): void {
    const r = this.radius;
    const w = bounds.width;
    const h = bounds.height;

    if (this.pos.x < r) {
      this.pos.x = r;
      if (this.vel.x < 0) this.vel.x = -this.vel.x * Particle.BOUND_DAMPING;
    } else if (this.pos.x > w - r) {
      this.pos.x = w - r;
      if (this.vel.x > 0) this.vel.x = -this.vel.x * Particle.BOUND_DAMPING;
    }

    if (this.pos.y < r) {
      this.pos.y = r;
      if (this.vel.y < 0) this.vel.y = -this.vel.y * Particle.BOUND_DAMPING;
    } else if (this.pos.y > h - r) {
      this.pos.y = h - r;
      if (this.vel.y > 0) this.vel.y = -this.vel.y * Particle.BOUND_DAMPING;
    }
  }

  public speed(): number {
    return Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
  }

  public applyForce(fx: number, fy: number): void {
    this.acc.x += fx / this.mass;
    this.acc.y += fy / this.mass;
  }
}
