import { Bullet } from './Bullet';

export class Player {
  x: number;
  y: number;
  speed = 150;
  lives = 3;
  maxLives = 3;
  shootCooldown = 0;
  shootInterval = 0.2;
  invincible = false;
  invincibleTimer = 0;
  invincibleDuration = 0.9;
  blinking = false;
  blinkTimer = 0;
  blinkInterval = 0.15;
  blinkCount = 0;
  blinkMax = 6;
  blinkOpacity = 1;
  trailParticles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];
  width = 24;
  height = 28;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  update(dt: number, keys: Set<string>, bullets: Bullet[]): void {
    let moving = false;
    if (keys.has('ArrowUp')) { this.y -= this.speed * dt; moving = true; }
    if (keys.has('ArrowDown')) { this.y += this.speed * dt; moving = true; }
    if (keys.has('ArrowLeft')) { this.x -= this.speed * dt; moving = true; }
    if (keys.has('ArrowRight')) { this.x += this.speed * dt; moving = true; }

    this.x = Math.max(12, Math.min(628, this.x));
    this.y = Math.max(14, Math.min(466, this.y));

    this.shootCooldown -= dt;
    if (keys.has('Space') && this.shootCooldown <= 0) {
      bullets.push(new Bullet(this.x, this.y - this.height / 2, 0, -400));
      this.shootCooldown = this.shootInterval;
    }

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.blinking) {
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
          this.blinkOpacity = this.blinkOpacity === 1 ? 0.3 : 1;
          this.blinkTimer = this.blinkInterval;
          this.blinkCount++;
          if (this.blinkCount >= this.blinkMax) {
            this.invincible = false;
            this.blinking = false;
            this.blinkOpacity = 1;
          }
        }
      }
    }

    if (moving) {
      const count = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < count; i++) {
        this.trailParticles.push({
          x: this.x + (Math.random() - 0.5) * 6,
          y: this.y + this.height / 2,
          vx: (Math.random() - 0.5) * 20,
          vy: 30 + Math.random() * 30,
          life: 0.3,
          maxLife: 0.3,
          size: 2 + Math.random() * 2,
        });
      }
    }

    for (const p of this.trailParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.trailParticles = this.trailParticles.filter(p => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.trailParticles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = this.blinkOpacity;

    ctx.fillStyle = '#4FC3F7';
    ctx.strokeStyle = '#81D4FA';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 14);
    ctx.lineTo(this.x - 12, this.y + 14);
    ctx.lineTo(this.x + 12, this.y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  hit(): boolean {
    if (this.invincible) return false;
    this.lives--;
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    this.blinking = true;
    this.blinkTimer = this.blinkInterval;
    this.blinkCount = 0;
    this.blinkOpacity = 0.3;
    return true;
  }

  resetPosition(): void {
    this.x = 320;
    this.y = 420;
  }

  isDead(): boolean {
    return this.lives <= 0;
  }
}
