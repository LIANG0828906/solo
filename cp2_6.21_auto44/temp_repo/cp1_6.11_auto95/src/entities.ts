export type BulletColor = '#FF3333' | '#33FFFF' | '#AA66FF';
export type BulletPattern = 'straight' | 'fan' | 'tracking';

export interface Vec2 {
  x: number;
  y: number;
}

export const BULLET_COLORS: BulletColor[] = ['#FF3333', '#33FFFF', '#AA66FF'];

export class Ship {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number = 25;
  shield: number = 100;
  isHit: boolean = false;
  hitFlashTimer: number = 0;
  hitFlashCount: number = 0;
  invincibleTimer: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  update(dt: number) {
    this.x += (this.targetX - this.x) * Math.min(1, dt * 10);
    this.y += (this.targetY - this.y) * Math.min(1, dt * 10);

    if (this.isHit) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        this.hitFlashCount++;
        if (this.hitFlashCount >= 6) {
          this.isHit = false;
          this.hitFlashCount = 0;
        } else {
          this.hitFlashTimer = 0.15;
        }
      }
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
  }

  triggerHit() {
    this.isHit = true;
    this.hitFlashTimer = 0.15;
    this.hitFlashCount = 0;
    this.invincibleTimer = 0.9;
  }

  getRadius(): number {
    return this.size * 0.4;
  }
}

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  color: BulletColor;
  pattern: BulletPattern;
  sourceId: number;
  age: number = 0;
  private targetRef: { x: number; y: number } | null = null;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    speed: number,
    color: BulletColor,
    pattern: BulletPattern,
    sourceId: number,
    targetRef?: { x: number; y: number }
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.speed = speed;
    this.color = color;
    this.pattern = pattern;
    this.sourceId = sourceId;
    if (targetRef) this.targetRef = targetRef;
  }

  update(dt: number, canvasW: number, canvasH: number) {
    this.age += dt;

    if (this.pattern === 'tracking' && this.targetRef && this.age < 3) {
      const dx = this.targetRef.x - this.x;
      const dy = this.targetRef.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const turnRate = 0.5 * dt;
        const desiredVx = (dx / dist) * this.speed;
        const desiredVy = (dy / dist) * this.speed;
        this.vx += (desiredVx - this.vx) * turnRate;
        this.vy += (desiredVy - this.vy) * turnRate;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > 0) {
          this.vx = (this.vx / currentSpeed) * this.speed;
          this.vy = (this.vy / currentSpeed) * this.speed;
        }
      }
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
  }

  isOutOfBounds(canvasW: number, canvasH: number): boolean {
    const margin = 50;
    return (
      this.x < -margin ||
      this.x > canvasW + margin ||
      this.y < -margin ||
      this.y > canvasH + margin
    );
  }
}

export class BulletSource {
  id: number;
  x: number;
  y: number;
  active: boolean = true;
  nextFireTime: number = 0;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  getRadius(): number {
    return 15;
  }
}

export class Laser {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  duration: number = 0.3;
  age: number = 0;
  sourceId: number;
  hit: boolean = false;

  constructor(startX: number, startY: number, targetX: number, targetY: number, sourceId: number) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.sourceId = sourceId;
  }

  update(dt: number): boolean {
    this.age += dt;
    return this.age < this.duration;
  }

  getAlpha(): number {
    const t = this.age / this.duration;
    return 1 - t * t;
  }
}

export class Explosion {
  particles: Particle[] = [];
  duration: number = 0.5;
  age: number = 0;

  constructor(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 50 + Math.random() * 80;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed));
    }
  }

  update(dt: number): boolean {
    this.age += dt;
    for (const p of this.particles) {
      p.update(this.age, this.duration);
    }
    return this.age < this.duration;
  }

  getAlpha(): number {
    const t = this.age / this.duration;
    return 1 - t;
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  startX: number;
  startY: number;

  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.startX = x;
    this.startY = y;
  }

  update(currentAge: number, totalDuration: number) {
    const t = Math.min(1, currentAge / totalDuration);
    const eased = 1 - Math.pow(1 - t, 3);
    this.x = this.startX + this.vx * totalDuration * eased;
    this.y = this.startY + this.vy * totalDuration * eased;
  }
}

export class Star {
  x: number;
  y: number;
  brightness: number;
  period: number;
  phase: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.brightness = 0.3 + Math.random() * 0.7;
    this.period = 2 + Math.random() * 2;
    this.phase = Math.random() * Math.PI * 2;
  }

  getCurrentBrightness(time: number): number {
    const t = (time / this.period + this.phase) * Math.PI * 2;
    return 0.3 + (Math.sin(t) * 0.5 + 0.5) * 0.7 * this.brightness;
  }
}

export function circleCircleCollision(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy <= (r1 + r2) * (r1 + r2);
}
