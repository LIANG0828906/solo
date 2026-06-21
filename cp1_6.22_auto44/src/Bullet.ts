import type { Rect, Position } from './types';
import { BulletType, BULLET_SIZE, PLAYER_BULLET_SPEED, ENEMY_BULLET_SPEED, COLORS } from './types';
import { isOnScreen } from './utils';

export class Bullet {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public type: BulletType;
  public active: boolean;
  public width: number;
  public height: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.type = BulletType.PLAYER;
    this.active = false;
    this.width = BULLET_SIZE.width;
    this.height = BULLET_SIZE.height;
  }

  init(x: number, y: number, type: BulletType, targetX?: number, targetY?: number): void {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;

    if (type === BulletType.PLAYER) {
      this.vx = PLAYER_BULLET_SPEED;
      this.vy = 0;
    } else {
      const speed = ENEMY_BULLET_SPEED;
      if (targetX !== undefined && targetY !== undefined) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
      } else {
        this.vx = -speed;
        this.vy = 0;
      }
    }
  }

  update(dt: number): void {
    if (!this.active) return;
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (!isOnScreen(this.x, this.y, 100)) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    
    if (this.type === BulletType.PLAYER) {
      ctx.fillStyle = COLORS.ACCENT;
      ctx.shadowColor = COLORS.ACCENT;
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = COLORS.ENEMY;
      ctx.shadowColor = COLORS.ENEMY;
      ctx.shadowBlur = 8;
    }

    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
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

  getPosition(): Position {
    return { x: this.x, y: this.y };
  }
}
