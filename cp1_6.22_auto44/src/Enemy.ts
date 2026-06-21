import type { Rect } from './types';
import { EnemyType, COLORS, NORMAL_ENEMY_HEALTH, ELITE_ENEMY_HEALTH, ENEMY_BASE_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import { randomRange } from './utils';

export class Enemy {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public type: EnemyType;
  public health: number;
  public maxHealth: number;
  public active: boolean;
  public vx: number;
  public vy: number;
  public waveAmplitude: number;
  public waveFrequency: number;
  public wavePhase: number;
  public baseY: number;
  public lastShotTime: number;
  public shootInterval: number;
  public canShoot: boolean;
  public rotation: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 45;
    this.height = 35;
    this.type = EnemyType.NORMAL;
    this.health = NORMAL_ENEMY_HEALTH;
    this.maxHealth = NORMAL_ENEMY_HEALTH;
    this.active = false;
    this.vx = -ENEMY_BASE_SPEED;
    this.vy = 0;
    this.waveAmplitude = 0;
    this.waveFrequency = 0;
    this.wavePhase = 0;
    this.baseY = 0;
    this.lastShotTime = 0;
    this.shootInterval = 2000;
    this.canShoot = false;
    this.rotation = 0;
  }

  init(x: number, y: number, type: EnemyType, waveNumber: number): void {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.type = type;
    this.active = true;
    this.wavePhase = randomRange(0, Math.PI * 2);
    this.lastShotTime = 0;
    this.rotation = 0;

    if (type === EnemyType.ELITE) {
      this.width = 80;
      this.height = 60;
      this.health = ELITE_ENEMY_HEALTH;
      this.maxHealth = ELITE_ENEMY_HEALTH;
      this.vx = -ENEMY_BASE_SPEED * 0.7;
      this.waveAmplitude = randomRange(30, 60);
      this.waveFrequency = randomRange(1, 2);
      this.shootInterval = randomRange(1500, 2500);
      this.canShoot = true;
    } else {
      this.width = 45;
      this.height = 35;
      this.health = NORMAL_ENEMY_HEALTH;
      this.maxHealth = NORMAL_ENEMY_HEALTH;
      this.vx = -ENEMY_BASE_SPEED * randomRange(0.8, 1.2);
      this.waveAmplitude = randomRange(40, 80);
      this.waveFrequency = randomRange(1.5, 3);
      this.canShoot = Math.random() < 0.3 + waveNumber * 0.05;
      this.shootInterval = randomRange(2000, 4000);
    }

    this.vx -= waveNumber * 2;
  }

  update(dt: number, currentTime: number, playerY: number): { shouldShoot: boolean; targetX: number; targetY: number } | null {
    if (!this.active) return null;

    this.wavePhase += this.waveFrequency * dt;
    const waveOffset = Math.sin(this.wavePhase) * this.waveAmplitude;
    
    this.x += this.vx * dt;
    this.y = this.baseY + waveOffset;

    this.y = Math.max(this.height / 2, Math.min(CANVAS_HEIGHT - this.height / 2, this.y));

    if (this.x < -100) {
      this.active = false;
      return null;
    }

    if (this.canShoot && currentTime - this.lastShotTime > this.shootInterval && this.x < CANVAS_WIDTH - 100) {
      this.lastShotTime = currentTime;
      return {
        shouldShoot: true,
        targetX: 100,
        targetY: playerY
      };
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const color = this.type === EnemyType.ELITE ? COLORS.ELITE : COLORS.ENEMY;
    const bodyColor = this.type === EnemyType.ELITE ? '#cc6600' : '#cc2222';

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, 0);
    ctx.lineTo(-this.width / 4, -this.height / 2);
    ctx.lineTo(this.width / 2, -this.height / 4);
    ctx.lineTo(this.width / 2, this.height / 4);
    ctx.lineTo(-this.width / 4, this.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-this.width / 3, 0);
    ctx.lineTo(-this.width / 6, -this.height / 3);
    ctx.lineTo(this.width / 3, -this.height / 6);
    ctx.lineTo(this.width / 3, this.height / 6);
    ctx.lineTo(-this.width / 6, this.height / 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(this.width / 4, 0, this.type === EnemyType.ELITE ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === EnemyType.ELITE && this.health < this.maxHealth) {
      ctx.shadowBlur = 0;
      const barWidth = this.width;
      const barHeight = 6;
      const barX = -barWidth / 2;
      const barY = -this.height / 2 - 15;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = COLORS.ELITE;
      ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
    }

    ctx.restore();
  }

  hit(): boolean {
    this.health--;
    return this.health <= 0;
  }

  getRect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  isElite(): boolean {
    return this.type === EnemyType.ELITE;
  }
}
