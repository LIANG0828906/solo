import { Vec2, Bullet, clamp, distance, randRange } from './types';
import { ParticleSystem } from './particle';

export class Player {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  angle: number = -Math.PI / 2;
  speed: number = 4;
  radius: number = 18;
  health: number = 100;
  maxHealth: number = 100;
  lastHealth: number = 100;
  healthChanged: boolean = false;
  shootCooldown: number = 0;
  shootInterval: number = 0.2;
  color: string = '#4dc9ff';
  trailTimer: number = 0;
  invulnerable: number = 0;
  score: number = 0;

  keys: Set<string> = new Set();
  mouse: Vec2 = { x: 0, y: 0 };
  mouseDown: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, canvasWidth: number, canvasHeight: number, bullets: Bullet[], particles: ParticleSystem): void {
    this.healthChanged = false;
    let moveX = 0;
    let moveY = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) moveY -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) moveY += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) moveX -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) moveX += 1;

    const mag = Math.sqrt(moveX * moveX + moveY * moveY);
    if (mag > 0) {
      moveX /= mag;
      moveY /= mag;
      this.vx = moveX * this.speed;
      this.vy = moveY * this.speed;
    } else {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.x = clamp(this.x, this.radius, canvasWidth - this.radius);
    this.y = clamp(this.y, this.radius, canvasHeight - this.radius);

    this.angle = Math.atan2(this.mouse.y - this.y, this.mouse.x - this.x);

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    if (this.mouseDown && this.shootCooldown <= 0) {
      this.shoot(bullets);
      this.shootCooldown = this.shootInterval;
    }

    this.trailTimer -= dt;
    if (this.trailTimer <= 0 && (mag > 0 || Math.abs(this.vx) + Math.abs(this.vy) > 0.5)) {
      const tailX = this.x + Math.cos(this.angle + Math.PI) * this.radius;
      const tailY = this.y + Math.sin(this.angle + Math.PI) * this.radius;
      particles.spawnTrail(tailX, tailY, this.angle, 5);
      this.trailTimer = 0.03;
    }

    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  shoot(bullets: Bullet[]): void {
    const bulletSpeed = 10;
    bullets.push({
      x: this.x + Math.cos(this.angle) * this.radius,
      y: this.y + Math.sin(this.angle) * this.radius,
      vx: Math.cos(this.angle) * bulletSpeed,
      vy: Math.sin(this.angle) * bulletSpeed,
      radius: 4,
      life: 2,
      fromPlayer: true,
      color: '#4dc9ff'
    });
  }

  takeDamage(amount: number, particles: ParticleSystem): boolean {
    if (this.invulnerable > 0) return false;
    this.lastHealth = this.health;
    this.health = Math.max(0, this.health - amount);
    this.healthChanged = true;
    this.invulnerable = 0.5;
    particles.spawnExplosion(this.x, this.y, 10);
    return this.health <= 0;
  }

  checkCollision(obj: { x: number; y: number; radius: number }): boolean {
    const d = distance({ x: this.x, y: this.y }, { x: obj.x, y: obj.y });
    return d < this.radius + obj.radius;
  }
}
