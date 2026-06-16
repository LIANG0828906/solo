import type { Anchor, EnergyBall, Spike, Platform, Checkpoint } from './level';

export type GrappleState = 'idle' | 'firing' | 'swinging' | 'retracting';

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  gravityDir: number;
  onGround: boolean;
  facing: 'left' | 'right' | 'up' | 'down';
  animFrame: number;
  animTimer: number;
  flashTimer: number;
}

export class Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  gravityDir: number;
  gravity: number;
  onGround: boolean;
  facing: 'left' | 'right' | 'up' | 'down';
  animFrame: number;
  animTimer: number;
  flashTimer: number;
  lives: number;
  maxLives: number;

  grappleState: GrappleState;
  grappleX: number;
  grappleY: number;
  grappleTargetX: number;
  grappleTargetY: number;
  grappleDirX: number;
  grappleDirY: number;
  grappleSpeed: number;
  grappleMaxLength: number;
  grappleLength: number;
  grappleProgress: number;
  attachedAnchor: Anchor | null;
  swingAngle: number;
  swingAngularVel: number;
  swingRadius: number;
  lastSwingTangentX: number;
  lastSwingTangentY: number;

  respawnX: number;
  respawnY: number;
  deathFade: number;
  isDead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 40;
    this.vx = 0;
    this.vy = 0;
    this.gravityDir = 1;
    this.gravity = 980;
    this.onGround = false;
    this.facing = 'right';
    this.animFrame = 0;
    this.animTimer = 0;
    this.flashTimer = 0;
    this.lives = 3;
    this.maxLives = 3;

    this.grappleState = 'idle';
    this.grappleX = 0;
    this.grappleY = 0;
    this.grappleTargetX = 0;
    this.grappleTargetY = 0;
    this.grappleDirX = 0;
    this.grappleDirY = 0;
    this.grappleSpeed = 800;
    this.grappleMaxLength = 500;
    this.grappleLength = 0;
    this.grappleProgress = 0;
    this.attachedAnchor = null;
    this.swingAngle = 0;
    this.swingAngularVel = 0;
    this.swingRadius = 0;
    this.lastSwingTangentX = 0;
    this.lastSwingTangentY = 0;

    this.respawnX = x;
    this.respawnY = y;
    this.deathFade = 0;
    this.isDead = false;
  }

  getHandX(): number {
    return this.x + this.w / 2 + (this.facing === 'left' ? -6 : 6);
  }

  getHandY(): number {
    return this.y + this.h * 0.35;
  }

  fireGrapple(worldMouseX: number, worldMouseY: number): void {
    if (this.grappleState === 'swinging') {
      this.releaseGrapple();
      return;
    }
    if (this.grappleState === 'firing') {
      this.resetGrapple();
      return;
    }
    const hx = this.getHandX();
    const hy = this.getHandY();
    let dx = worldMouseX - hx;
    let dy = worldMouseY - hy;
    const len = Math.hypot(dx, dy);
    if (len < 1) {
      dx = 1;
      dy = 0;
    } else {
      dx /= len;
      dy /= len;
    }
    this.grappleDirX = dx;
    this.grappleDirY = dy;
    this.grappleX = hx;
    this.grappleY = hy;
    this.grappleLength = 0;
    this.grappleState = 'firing';
    this.grappleProgress = 0;
  }

  resetGrapple(): void {
    this.grappleState = 'idle';
    this.grappleProgress = 0;
    this.grappleLength = 0;
    this.grappleX = 0;
    this.grappleY = 0;
    this.grappleTargetX = 0;
    this.grappleTargetY = 0;
    this.grappleDirX = 0;
    this.grappleDirY = 0;
    this.attachedAnchor = null;
    this.swingAngularVel = 0;
    this.swingAngle = 0;
    this.swingRadius = 0;
    this.lastSwingTangentX = 0;
    this.lastSwingTangentY = 0;
  }

  releaseGrapple(): void {
    if (this.grappleState === 'swinging' && this.attachedAnchor) {
      const tangentX = this.lastSwingTangentX;
      const tangentY = this.lastSwingTangentY;
      const speed = this.swingAngularVel * this.swingRadius;
      this.vx = tangentX * speed;
      this.vy = tangentY * speed;
    }
    this.grappleState = 'retracting';
    this.grappleProgress = 1;
  }

  attachToAnchor(anchor: Anchor): void {
    this.attachedAnchor = anchor;
    const dx = this.x + this.w / 2 - anchor.x;
    const dy = this.y + this.h / 2 - anchor.y;
    this.swingRadius = Math.max(40, Math.hypot(dx, dy));
    this.swingAngle = Math.atan2(dy, dx);
    const tangentX = -Math.sin(this.swingAngle);
    const tangentY = Math.cos(this.swingAngle);
    const currentSpeed = Math.hypot(this.vx, this.vy);
    const dot = this.vx * tangentX + this.vy * tangentY;
    this.swingAngularVel = dot / this.swingRadius;
    this.lastSwingTangentX = tangentX;
    this.lastSwingTangentY = tangentY;
    this.grappleState = 'swinging';
  }

  flipGravity(): void {
    this.gravityDir *= -1;
    this.flashTimer = 0.1;
  }

  update(dt: number, platforms: Platform[], anchors: Anchor[], levelW: number, levelH: number): void {
    if (this.isDead) {
      this.deathFade = Math.min(1, this.deathFade + dt / 0.3);
      return;
    }

    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.animTimer += dt;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    if (this.grappleState === 'firing') {
      this.updateFiringGrapple(dt, anchors);
    } else if (this.grappleState === 'swinging') {
      this.updateSwinging(dt);
    } else if (this.grappleState === 'retracting') {
      this.grappleProgress -= dt / 0.15;
      if (this.grappleProgress <= 0) {
        this.resetGrapple();
      }
    }

    if (this.grappleState !== 'swinging') {
      this.vy += this.gravity * this.gravityDir * dt;
      this.vx *= 0.98;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.handlePlatformCollision(platforms);
    }

    if (this.vx > 10) this.facing = 'right';
    else if (this.vx < -10) this.facing = 'left';

    this.updateFacing();
  }

  updateFacing(): void {
    if (Math.abs(this.vx) > Math.abs(this.vy)) {
      this.facing = this.vx >= 0 ? 'right' : 'left';
    } else {
      this.facing = this.vy >= 0 ? 'down' : 'up';
    }
  }

  updateFiringGrapple(dt: number, anchors: Anchor[]): void {
    this.grappleLength += this.grappleSpeed * dt;
    this.grappleX = this.getHandX() + this.grappleDirX * this.grappleLength;
    this.grappleY = this.getHandY() + this.grappleDirY * this.grappleLength;
    this.grappleProgress = Math.min(1, this.grappleLength / 80);

    if (this.grappleLength >= this.grappleMaxLength) {
      this.grappleState = 'retracting';
      this.grappleProgress = 1;
      return;
    }

    for (const a of anchors) {
      const d = Math.hypot(this.grappleX - a.x, this.grappleY - a.y);
      if (d < a.radius + 6) {
        this.attachToAnchor(a);
        return;
      }
    }
  }

  updateSwinging(dt: number): void {
    if (!this.attachedAnchor) return;

    const g = this.gravity * this.gravityDir;
    const angularAccel = -(g / this.swingRadius) * Math.sin(this.swingAngle);
    this.swingAngularVel += angularAccel * dt;
    this.swingAngularVel *= 0.998;
    this.swingAngle += this.swingAngularVel * dt;

    const cx = this.attachedAnchor.x;
    const cy = this.attachedAnchor.y;
    this.x = cx + Math.cos(this.swingAngle) * this.swingRadius - this.w / 2;
    this.y = cy + Math.sin(this.swingAngle) * this.swingRadius - this.h / 2;

    this.lastSwingTangentX = -Math.sin(this.swingAngle);
    this.lastSwingTangentY = Math.cos(this.swingAngle);
  }

  handlePlatformCollision(platforms: Platform[]): void {
    this.onGround = false;
    for (const p of platforms) {
      if (this.x + this.w > p.x && this.x < p.x + p.w &&
          this.y + this.h > p.y && this.y < p.y + p.h) {
        const overlapTop = (this.y + this.h) - p.y;
        const overlapBottom = (p.y + p.h) - this.y;
        const overlapLeft = (this.x + this.w) - p.x;
        const overlapRight = (p.x + p.w) - this.x;
        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
        if (minOverlap === overlapTop && this.gravityDir > 0) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
        } else if (minOverlap === overlapBottom && this.gravityDir < 0) {
          this.y = p.y + p.h;
          this.vy = 0;
          this.onGround = true;
        } else if (minOverlap === overlapLeft) {
          this.x = p.x - this.w;
          this.vx = 0;
        } else if (minOverlap === overlapRight) {
          this.x = p.x + p.w;
          this.vx = 0;
        }
      }
    }
  }

  checkEnergyBallCollision(balls: EnergyBall[], onCollect: () => void): void {
    for (const b of balls) {
      if (b.collected) continue;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      if (Math.hypot(cx - b.x, cy - b.y) < b.radius + 15) {
        b.collected = true;
        b.collectAnim = 0.2;
        onCollect();
      }
    }
  }

  checkSpikeCollision(spikes: Spike[]): boolean {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    for (const s of spikes) {
      if (Math.hypot(cx - s.x, cy - (s.y - s.size / 2)) < s.size * 0.7) {
        return true;
      }
    }
    return false;
  }

  checkOutOfBounds(levelW: number, levelH: number): boolean {
    return this.y > levelH + 100 || this.y < -100 || this.x < -100 || this.x > levelW + 100;
  }

  respawn(cp: Checkpoint): void {
    this.x = cp.x - this.w / 2;
    this.y = cp.y - cp.height;
    this.vx = 0;
    this.vy = 0;
    this.gravityDir = 1;
    this.resetGrapple();
    this.isDead = false;
    this.deathFade = 0;
    this.flashTimer = 0.1;
  }

  takeDamage(cp: Checkpoint): boolean {
    this.lives--;
    if (this.lives <= 0) {
      this.isDead = true;
      return true;
    }
    this.respawn(cp);
    return false;
  }
}
