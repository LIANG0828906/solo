import { Bullet } from './airship';

export interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

export type EnemyType = 'scout' | 'heavy';

export class Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  bullets: Bullet[] = [];
  active: boolean = true;
  shootTimer: number;
  shootInterval: number;
  mode: 'patrol' | 'chase' = 'patrol';
  patrolBaseY: number;
  patrolAmplitude: number;
  patrolPhase: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    const roll = Math.random();
    if (roll < 0.6) {
      this.type = 'scout';
      this.width = 60;
      this.height = 35;
      this.color = '#8B4513';
      this.speed = 100 + Math.random() * 20;
      this.health = 1;
      this.maxHealth = 1;
    } else {
      this.type = 'heavy';
      this.width = 90;
      this.height = 55;
      this.color = '#4A2E15';
      this.speed = 80;
      this.health = 3;
      this.maxHealth = 3;
    }

    this.x = canvasWidth + this.width;
    this.y = 30 + Math.random() * (canvasHeight - 90 - this.height);
    this.speed = 80 + Math.random() * 40;
    this.shootInterval = 2 + Math.random();
    this.shootTimer = this.shootInterval;
    this.patrolBaseY = this.y;
    this.patrolAmplitude = 20 + Math.random() * 30;
    this.patrolPhase = Math.random() * Math.PI * 2;
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.x -= this.speed * dt;

    if (this.type === 'scout') {
      this.patrolPhase += dt * 2;
      this.y = this.patrolBaseY + Math.sin(this.patrolPhase) * this.patrolAmplitude;
    } else {
      const dy = playerY - this.y;
      if (Math.abs(dy) > 20) {
        this.y += Math.sign(dy) * 40 * dt;
      }
    }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && this.x > 0) {
      this.fireBullet();
      this.shootTimer = this.shootInterval;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(dt);
      if (this.bullets[i].x < -20) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private fireBullet(): void {
    const bullet = new Bullet(
      this.x,
      this.y + this.height / 2 - 3,
      6, 6,
      250,
      '#FF3333',
      -1
    );
    this.bullets.push(bullet);
  }

  takeDamage(): boolean {
    this.health--;
    if (this.health <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, cy);
    ctx.lineTo(this.x + this.width * 0.2, this.y + 4);
    ctx.lineTo(this.x + this.width - 3, this.y + 4);
    ctx.lineTo(this.x + this.width + 3, cy);
    ctx.lineTo(this.x + this.width - 3, this.y + this.height - 4);
    ctx.lineTo(this.x + this.width * 0.2, this.y + this.height - 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.type === 'heavy') {
      ctx.fillStyle = '#B87333';
      ctx.fillRect(cx - 8, this.y + 3, 16, this.height - 6);
      ctx.fillStyle = '#3B2F2A';
      ctx.fillRect(cx - 4, this.y + 8, 8, 6);
      ctx.fillRect(cx - 4, this.y + this.height - 14, 8, 6);
    }

    ctx.fillStyle = '#B87333';
    ctx.fillRect(this.x - 4, cy - 2, 6, 4);

    ctx.fillStyle = '#6B5B4F';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width * 0.3, this.y - 8, this.type === 'heavy' ? 12 : 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();

    for (const bullet of this.bullets) {
      bullet.draw(ctx);
    }
  }

  isOffScreen(): boolean {
    return this.x + this.width < -50;
  }

  getBounds(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  static createDebris(enemy: Enemy): Debris[] {
    const debris: Debris[] = [];
    const count = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      debris.push({
        x: enemy.x + Math.random() * enemy.width,
        y: enemy.y + Math.random() * enemy.height,
        vx: (Math.random() - 0.3) * 200,
        vy: (Math.random() - 0.5) * 200,
        size: 5 + Math.random() * 10,
        color: i % 3 === 0 ? '#B87333' : enemy.color,
        life: 0.5,
        maxLife: 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
    return debris;
  }
}

export class DebrisManager {
  debris: Debris[] = [];

  addDebris(items: Debris[]): void {
    this.debris.push(...items);
  }

  update(dt: number): void {
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 100 * dt;
      d.rotation += d.rotationSpeed * dt;
      d.life -= dt;
      if (d.life <= 0) {
        this.debris.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const d of this.debris) {
      const alpha = d.life / d.maxLife;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.fillStyle = d.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }
  }
}
