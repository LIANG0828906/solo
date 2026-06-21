import type { InputState, Rect } from './types';
import { PLAYER_SPEED, PLAYER_SIZE, PLAYER_MAX_HEALTH, PLAYER_FIRE_RATE, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, BulletType } from './types';
import { clamp } from './utils';
import type { BulletManager } from './BulletManager';
import type { ParticleSystem } from './ParticleSystem';
import type { AudioManager } from './AudioManager';

export class Player {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public health: number;
  public maxHealth: number;
  public active: boolean;
  public isInvincible: boolean;
  public invincibleTime: number;
  public isDying: boolean;
  public deathTime: number;
  public rotation: number;
  public scale: number;

  private lastShotTime: number;
  private bulletManager: BulletManager;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  private edgeScrollFrame: number;
  private currentEdge: 'left' | 'right' | null;

  constructor(bulletManager: BulletManager, particleSystem: ParticleSystem, audioManager: AudioManager) {
    this.x = 150;
    this.y = CANVAS_HEIGHT / 2;
    this.width = PLAYER_SIZE.width;
    this.height = PLAYER_SIZE.height;
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.active = true;
    this.isInvincible = false;
    this.invincibleTime = 0;
    this.isDying = false;
    this.deathTime = 0;
    this.rotation = 0;
    this.scale = 1;
    this.lastShotTime = 0;
    this.bulletManager = bulletManager;
    this.particleSystem = particleSystem;
    this.audioManager = audioManager;
    this.edgeScrollFrame = 0;
    this.currentEdge = null;
  }

  reset(): void {
    this.x = 150;
    this.y = CANVAS_HEIGHT / 2;
    this.health = PLAYER_MAX_HEALTH;
    this.active = true;
    this.isInvincible = false;
    this.invincibleTime = 0;
    this.isDying = false;
    this.deathTime = 0;
    this.rotation = 0;
    this.scale = 1;
    this.lastShotTime = 0;
    this.edgeScrollFrame = 0;
    this.currentEdge = null;
  }

  update(dt: number, input: InputState, currentTime: number): void {
    if (this.isDying) {
      this.updateDeathAnimation(dt);
      return;
    }

    if (!this.active) return;

    let dx = 0;
    let dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.sqrt(2);
      dx *= invLen;
      dy *= invLen;
    }

    this.x += dx * PLAYER_SPEED * dt;
    this.y += dy * PLAYER_SPEED * dt;

    const minX = this.width / 2;
    const maxX = CANVAS_WIDTH / 2;
    const minY = CANVAS_HEIGHT / 2 + this.height;
    const maxY = CANVAS_HEIGHT - this.height / 2;

    this.x = clamp(this.x, minX, maxX);
    this.y = clamp(this.y, minY, maxY);

    if (this.x <= minX + 5) {
      this.currentEdge = 'left';
      this.edgeScrollFrame = (this.edgeScrollFrame + 1) % 4;
    } else if (this.x >= maxX - 5) {
      this.currentEdge = 'right';
      this.edgeScrollFrame = (this.edgeScrollFrame + 1) % 4;
    } else {
      this.currentEdge = null;
      this.edgeScrollFrame = 0;
    }

    if (input.shoot && currentTime - this.lastShotTime > PLAYER_FIRE_RATE) {
      this.shoot();
      this.lastShotTime = currentTime;
    }

    if (this.isInvincible) {
      this.invincibleTime -= dt * 1000;
      if (this.invincibleTime <= 0) {
        this.isInvincible = false;
      }
    }
  }

  private shoot(): void {
    this.bulletManager.spawn(
      this.x + this.width / 2,
      this.y,
      BulletType.PLAYER
    );
    this.audioManager.playShootSound();
  }

  private updateDeathAnimation(dt: number): void {
    this.deathTime += dt;
    
    this.rotation += 5 * dt;
    this.scale = Math.max(0, 1 - this.deathTime * 0.8);

    if (this.deathTime > 0.1 && this.deathTime < 1.5) {
      if (Math.random() < 0.3) {
        this.particleSystem.spawnDebris(this.x, this.y, 2);
      }
    }

    if (this.deathTime > 2) {
      this.active = false;
    }
  }

  hit(): boolean {
    if (this.isInvincible || this.isDying) return false;

    this.health--;
    this.audioManager.playHitSound();

    if (this.health <= 0) {
      this.die();
      return true;
    } else {
      this.isInvincible = true;
      this.invincibleTime = 2000;
      return false;
    }
  }

  private die(): void {
    this.isDying = true;
    this.deathTime = 0;
    this.audioManager.playPlayerDeathSound();
    this.particleSystem.spawnDebris(this.x, this.y, 12);
    this.particleSystem.spawnExplosion(this.x, this.y, 30, false);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);

    if (this.isInvincible && Math.floor(this.invincibleTime / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (this.currentEdge) {
      const scrollOffset = (this.edgeScrollFrame < 2) ? 0 : -3;
      if (this.currentEdge === 'left') {
        ctx.translate(-scrollOffset, 0);
      } else {
        ctx.translate(scrollOffset, 0);
      }
    }

    ctx.shadowColor = COLORS.PLAYER;
    ctx.shadowBlur = 20;

    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(-this.width / 2, -this.height / 2);
    ctx.lineTo(-this.width / 3, 0);
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0088aa';
    ctx.beginPath();
    ctx.moveTo(this.width / 3, 0);
    ctx.lineTo(-this.width / 4, -this.height / 3);
    ctx.lineTo(-this.width / 6, 0);
    ctx.lineTo(-this.width / 4, this.height / 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.width / 6, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    if (!this.isDying) {
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 15;
      
      const flameLength = 15 + Math.random() * 10;
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, -8);
      ctx.lineTo(-this.width / 2 - flameLength, 0);
      ctx.lineTo(-this.width / 2, 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  getRect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  getY(): number {
    return this.y;
  }

  isDead(): boolean {
    return !this.active || this.isDying;
  }
}
