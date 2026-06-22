import type { AABB, InputState } from './types';
import type { Platform } from './platform';
import type { ParticlePool } from './utils';
import { clamp, lerp } from './utils';

export class Player implements AABB {
  x: number;
  y: number;
  width: number = 32;
  height: number = 32;
  vx: number = 0;
  vy: number = 0;
  onGround: boolean = false;
  wasOnGround: boolean = false;
  facingRight: boolean = true;

  coyoteTime: number = 0;
  jumpBuffer: number = 0;
  maxCoyoteTime: number = 0.1;
  maxJumpBuffer: number = 0.15;

  moveSpeed: number = 300;
  jumpForce: number = -600;
  gravity: number = 1500;
  airControl: number = 0.6;
  friction: number = 0.85;

  squashStretch: number = 1;
  targetSquashStretch: number = 1;

  respawnAlpha: number = 1;
  isRespawning: boolean = false;
  respawnTimer: number = 0;

  currentPlatform: Platform | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(
    dt: number,
    input: InputState,
    platforms: Platform[],
    particlePool: ParticlePool
  ): void {
    if (this.isRespawning) {
      this.respawnTimer -= dt;
      this.respawnAlpha = 1 - this.respawnTimer / 0.5;
      if (this.respawnTimer <= 0) {
        this.isRespawning = false;
        this.respawnAlpha = 1;
      }
      return;
    }

    this.wasOnGround = this.onGround;
    this.onGround = false;
    this.currentPlatform = null;

    this.coyoteTime = Math.max(0, this.coyoteTime - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    const controlFactor = this.wasOnGround ? 1 : this.airControl;
    let targetVx = 0;

    if (input.left) {
      targetVx = -this.moveSpeed * controlFactor;
      this.facingRight = false;
    }
    if (input.right) {
      targetVx = this.moveSpeed * controlFactor;
      this.facingRight = true;
    }

    if (this.wasOnGround) {
      if (targetVx === 0) {
        this.vx *= this.friction;
        if (Math.abs(this.vx) < 10) this.vx = 0;
      } else {
        this.vx = lerp(this.vx, targetVx, 0.2);
      }
    } else {
      this.vx = lerp(this.vx, targetVx, 0.05);
    }

    if (input.jump) {
      this.jumpBuffer = this.maxJumpBuffer;
    }

    if (this.jumpBuffer > 0 && (this.wasOnGround || this.coyoteTime > 0)) {
      this.vy = this.jumpForce;
      this.jumpBuffer = 0;
      this.coyoteTime = 0;
      this.targetSquashStretch = 1.3;
    }

    this.vy += this.gravity * dt;
    this.vy = clamp(this.vy, -1000, 1000);

    this.x += this.vx * dt;
    this.resolveHorizontalCollisions(platforms);

    this.y += this.vy * dt;
    this.resolveVerticalCollisions(platforms, particlePool);

    if (!this.onGround && this.wasOnGround) {
      this.coyoteTime = this.maxCoyoteTime;
    }

    this.squashStretch = lerp(this.squashStretch, this.targetSquashStretch, 0.15);
    this.targetSquashStretch = lerp(this.targetSquashStretch, 1, 0.1);

    if (this.currentPlatform) {
      const dx = this.currentPlatform.x - this.currentPlatform.lastSafeX;
      const dy = this.currentPlatform.y - this.currentPlatform.lastSafeY;
      this.x += dx;
      this.y += dy;
    }
  }

  private resolveHorizontalCollisions(platforms: Platform[]): void {
    const playerAABB = this.getAABB();

    for (const platform of platforms) {
      if (!platform.collidesWith(playerAABB)) continue;

      if (this.vx > 0) {
        this.x = platform.x - this.width;
      } else if (this.vx < 0) {
        this.x = platform.x + platform.width;
      }
      this.vx = 0;
    }
  }

  private resolveVerticalCollisions(platforms: Platform[], particlePool: ParticlePool): void {
    const playerAABB = this.getAABB();

    for (const platform of platforms) {
      if (!platform.collidesWith(playerAABB)) continue;

      if (this.vy > 0) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
        this.currentPlatform = platform;

        if (!this.wasOnGround) {
          this.targetSquashStretch = 0.7;
          this.createDustParticles(particlePool);
          platform.triggerFragile();
        }
      } else if (this.vy < 0) {
        this.y = platform.y + platform.height;
        this.vy = 0;
      }
    }
  }

  private createDustParticles(particlePool: ParticlePool): void {
    const colors = ['#D4C4A8', '#C4B498', '#B8A888'];
    for (let i = 0; i < 8; i++) {
      const px = this.x + this.width / 2 + (Math.random() - 0.5) * this.width;
      const py = this.y + this.height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particlePool.emit(
        px, py, 1,
        color,
        30, 80, 2, 4, 0.5
      );
    }
  }

  respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isRespawning = true;
    this.respawnTimer = 0.5;
    this.respawnAlpha = 0;
    this.squashStretch = 1;
    this.targetSquashStretch = 1;
  }

  getAABB(): AABB {
    const margin = 2;
    return {
      x: this.x + margin,
      y: this.y + margin,
      width: this.width - margin * 2,
      height: this.height - margin * 2,
    };
  }

  isBelowScreen(screenHeight: number, cameraY: number): boolean {
    return this.y > cameraY + screenHeight + 100;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const px = this.x - cameraX;
    const py = this.y - cameraY;

    ctx.save();
    ctx.globalAlpha = this.respawnAlpha;

    const cx = px + this.width / 2;
    const cy = py + this.height / 2;

    ctx.translate(cx, cy);

    const scaleX = 1 / this.squashStretch;
    const scaleY = this.squashStretch;
    ctx.scale(scaleX, scaleY);

    const w = this.width / 2;
    const h = this.height / 2;
    const radius = 8;

    ctx.beginPath();
    ctx.moveTo(-w + radius, -h);
    ctx.lineTo(w - radius, -h);
    ctx.quadraticCurveTo(w, -h, w, -h + radius);
    ctx.lineTo(w, h - radius);
    ctx.quadraticCurveTo(w, h, w - radius, h);
    ctx.lineTo(-w + radius, h);
    ctx.quadraticCurveTo(-w, h, -w, h - radius);
    ctx.lineTo(-w, -h + radius);
    ctx.quadraticCurveTo(-w, -h, -w + radius, -h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-w, -h, w, h);
    gradient.addColorStop(0, '#7B59C4');
    gradient.addColorStop(1, '#4A90D9');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    const eyeOffsetX = this.facingRight ? 3 : -3;
    const eyeY = -3;
    const eyeRadius = 4;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-5 + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.arc(5 + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333333';
    const pupilOffsetX = this.facingRight ? 1 : -1;
    ctx.beginPath();
    ctx.arc(-5 + eyeOffsetX + pupilOffsetX, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(5 + eyeOffsetX + pupilOffsetX, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    if (!this.onGround) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 5, 5, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }
}
