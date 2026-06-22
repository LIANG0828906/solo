import { random } from './utils';

export interface ParticleOptions {
  x: number;
  y: number;
  speed?: number;
  radius?: number;
  life?: number;
  color?: string;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxLife: number;
  life: number;
  color: string;
  alpha: number;

  constructor(options: ParticleOptions) {
    const { x, y, speed = 2, radius = 3, life = 0.6, color = '#ff6b35' } = options;
    this.x = x;
    this.y = y;
    const angle = random(0, Math.PI * 2);
    const spd = random(speed * 0.3, speed);
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.radius = radius;
    this.maxLife = life;
    this.life = life;
    this.color = color;
    this.alpha = 1;
  }

  update(deltaTime: number): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= deltaTime;
    this.alpha = Math.max(0, this.life / this.maxLife);
    this.radius *= 0.98;
    return this.life > 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function createExplosion(
  x: number,
  y: number,
  count: number,
  color: string
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(
      new Particle({
        x,
        y,
        speed: random(3, 8),
        radius: random(2, 5),
        life: random(0.4, 0.8),
        color,
      })
    );
  }
  return particles;
}
