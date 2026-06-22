import { BulletData, TowerType, Position, MAX_PARTICLES } from './types';
import { Particle } from './particle';

let bulletIdCounter = 0;

export class Bullet implements BulletData {
  readonly id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  speed: number;
  towerType: TowerType;
  isPiercing: boolean;
  splashRadius: number;
  hitEnemies: Set<number>;
  life: number;
  active: boolean = true;

  constructor(data: Omit<BulletData, 'hitEnemies'>) {
    this.id = bulletIdCounter++;
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx;
    this.vy = data.vy;
    this.damage = data.damage;
    this.speed = data.speed;
    this.towerType = data.towerType;
    this.isPiercing = data.isPiercing;
    this.splashRadius = data.splashRadius;
    this.hitEnemies = new Set<number>();
    this.life = data.life;
  }

  update(deltaTime: number): boolean {
    this.x += this.vx * deltaTime / 16.67;
    this.y += this.vy * deltaTime / 16.67;
    this.life -= deltaTime;
    return this.life > 0 && this.active;
  }

  getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  getAngle(): number {
    return Math.atan2(this.vy, this.vx);
  }

  createHitParticles(): Particle[] {
    const particles: Particle[] = [];
    
    if (this.splashRadius > 0) {
      particles.push(...Particle.createExplosion(this.x, this.y, '#FF6600'));
    } else {
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push(Particle.createSpark(this.x, this.y, angle));
      }
    }
    
    return particles;
  }

  static create(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    towerType: TowerType,
    damage: number,
    speed: number,
    isPiercing: boolean,
    splashRadius: number
  ): Bullet {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    return new Bullet({
      x: fromX,
      y: fromY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      speed,
      towerType,
      isPiercing,
      splashRadius,
      life: 3000
    });
  }
}

export class BulletSystem {
  private bullets: Bullet[] = [];

  add(bullet: Bullet): void {
    if (this.bullets.length >= MAX_PARTICLES) {
      this.bullets.shift();
    }
    this.bullets.push(bullet);
  }

  update(deltaTime: number): void {
    this.bullets = this.bullets.filter(b => b.update(deltaTime));
  }

  getAll(): Bullet[] {
    return this.bullets;
  }

  remove(bullet: Bullet): void {
    const index = this.bullets.indexOf(bullet);
    if (index !== -1) {
      this.bullets.splice(index, 1);
    }
  }

  clear(): void {
    this.bullets = [];
  }

  getCount(): number {
    return this.bullets.length;
  }
}
