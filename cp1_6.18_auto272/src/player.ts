import { ParticleSystem } from './particle';

export class Player {
  x: number;
  y: number;
  width = 16;
  height = 24;
  vy = 0;
  isJumping = false;
  isOnGround = true;
  jumpHeight = 80;
  fallSpeed = 6;
  lives = 3;
  invincible = false;
  invincibleTimer = 0;
  blinkCount = 0;
  blinkTimer = 0;
  opacity = 1;
  wasOnGround = true;
  particleSystem: ParticleSystem;

  constructor(x: number, y: number, particleSystem: ParticleSystem) {
    this.x = x;
    this.y = y;
    this.particleSystem = particleSystem;
  }

  jump() {
    if (this.isOnGround && !this.isJumping) {
      this.isJumping = true;
      this.isOnGround = false;
      this.vy = -this.jumpHeight / 12;
    }
  }

  update(dt: number, groundY: number | null) {
    if (this.isJumping || !this.isOnGround) {
      this.vy += this.fallSpeed * 0.15;
      this.y += this.vy;
    }

    if (groundY !== null && this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.isJumping = false;
      if (!this.isOnGround) {
        this.particleSystem.addLandingParticles(this.x + this.width / 2, this.y + this.height);
      }
      this.isOnGround = true;
    } else if (groundY === null) {
      this.isOnGround = false;
    }

    if (this.invincible) {
      this.invincibleTimer -= dt;
      this.blinkTimer += dt;
      if (this.blinkTimer >= 0.2) {
        this.blinkTimer = 0;
        this.blinkCount++;
        this.opacity = this.opacity < 1 ? 1 : 0.3;
      }
      if (this.blinkCount >= 6 || this.invincibleTimer <= 0) {
        this.invincible = false;
        this.opacity = 1;
        this.blinkCount = 0;
        this.blinkTimer = 0;
      }
    }
  }

  hit() {
    if (this.invincible) return false;
    this.lives--;
    this.invincible = true;
    this.invincibleTimer = 1.2;
    this.blinkCount = 0;
    this.blinkTimer = 0;
    this.opacity = 0.3;
    return true;
  }

  reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.isJumping = false;
    this.isOnGround = true;
    this.lives = 3;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.blinkCount = 0;
    this.blinkTimer = 0;
    this.opacity = 1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.opacity;

    ctx.shadowColor = '#00BFA5';
    ctx.shadowBlur = 8;
    ctx.globalAlpha = this.opacity * 0.3;
    ctx.fillStyle = '#00BFA5';
    ctx.fillRect(this.x - 8, this.y - 8, this.width + 16, this.height + 16);

    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 12;
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = this.opacity * 0.7;
    ctx.fillRect(this.x + 4, this.y + 6, 3, 3);
    ctx.fillRect(this.x + 9, this.y + 6, 3, 3);

    ctx.globalAlpha = 1;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
