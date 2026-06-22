import { Rect, rectsOverlap, LevelElement } from './level';

export type EnemyType = 'patrol' | 'jump';

export class Enemy {
  x: number;
  y: number;
  width: number = 28;
  height: number = 28;
  vx: number = 0;
  vy: number = 0;
  enemyType: EnemyType;
  private direction: number = 1;
  private baseY: number;
  private jumpTimer: number = 0;
  private onGround: boolean = false;
  readonly gravity: number = 1000;
  readonly patrolSpeed: number = 80;
  readonly jumpInterval: number = 1.5;
  readonly jumpForce: number = 380;

  constructor(element: LevelElement) {
    this.x = element.x;
    this.y = element.y;
    this.baseY = element.y;
    this.enemyType =
      element.type === 'enemy-jump' ? 'jump' : 'patrol';
    this.width = element.width;
    this.height = element.height;

    if (this.enemyType === 'patrol') {
      this.vx = this.patrolSpeed;
    }
  }

  getRect(): Rect {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(dt: number, solids: Rect[]): void {
    if (this.enemyType === 'patrol') {
      this.x += this.vx * dt;
      const rect = this.getRect();
      let blocked = false;

      for (const solid of solids) {
        if (rectsOverlap(rect, solid)) {
          if (this.vx > 0) {
            this.x = solid.x - this.width;
          } else {
            this.x = solid.x + solid.width;
          }
          blocked = true;
          break;
        }
      }

      let hasGroundAhead = false;
      const footX = this.vx > 0 ? this.x + this.width + 2 : this.x - 2;
      const footY = this.y + this.height + 2;
      for (const solid of solids) {
        if (
          footX >= solid.x &&
          footX <= solid.x + solid.width &&
          footY >= solid.y &&
          footY <= solid.y + solid.height
        ) {
          hasGroundAhead = true;
          break;
        }
      }

      if (blocked || !hasGroundAhead) {
        this.direction *= -1;
        this.vx = this.patrolSpeed * this.direction;
      }
    } else {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      this.onGround = false;
      const rect = this.getRect();

      for (const solid of solids) {
        if (rectsOverlap(rect, solid)) {
          if (this.vy > 0) {
            this.y = solid.y - this.height;
            this.onGround = true;
            this.vy = 0;
          } else if (this.vy < 0) {
            this.y = solid.y + solid.height;
            this.vy = 0;
          }
        }
      }

      this.jumpTimer += dt;
      if (this.onGround && this.jumpTimer >= this.jumpInterval) {
        this.vy = -this.jumpForce;
        this.jumpTimer = 0;
        this.onGround = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.enemyType === 'patrol') {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      ctx.fillStyle = '#d94a6a';
      ctx.beginPath();
      ctx.arc(cx, cy, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      const eyeOffset = this.vx > 0 ? 3 : -3;
      ctx.beginPath();
      ctx.arc(cx - 5 + eyeOffset, cy - 3, 4, 0, Math.PI * 2);
      ctx.arc(cx + 5 + eyeOffset, cy - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(cx - 5 + eyeOffset + 1, cy - 3, 2, 0, Math.PI * 2);
      ctx.arc(cx + 5 + eyeOffset + 1, cy - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      ctx.fillStyle = '#9b59b6';
      ctx.beginPath();
      ctx.moveTo(cx, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.lineTo(this.x, this.y + this.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 4, cy + 4, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(cx - 4, cy + 4, 1.8, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy + 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCollisionBox(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255, 100, 150, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
    ctx.setLineDash([]);
  }
}
