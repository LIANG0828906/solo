import { distance, circleCollision, degToRad } from './utils';

export type BulletTrajectoryType = 'fan' | 'sine' | 'nshape' | 'cross';

export interface BulletState {
  x: number;
  y: number;
  baseVx: number;
  baseVy: number;
  age: number;
  sineAmplitude: number;
  sineFrequency: number;
  nshapePhase: number;
  nshapeTimer: number;
}

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  active: boolean;
  type: BulletTrajectoryType;
  state: BulletState;
  trail: { x: number; y: number }[];
  trailLength: number;
  pushedVx: number;
  pushedVy: number;
  pushTimer: number;

  constructor(
    x: number, y: number,
    vx: number, vy: number,
    type: BulletTrajectoryType,
    color: string,
    radius: number = 4
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.active = true;
    this.type = type;
    this.state = {
      x, y, baseVx: vx, baseVy: vy, age: 0,
      sineAmplitude: 30, sineFrequency: 0.05,
      nshapePhase: 0, nshapeTimer: 0
    };
    this.trail = [];
    this.trailLength = 6;
    this.pushedVx = 0;
    this.pushedVy = 0;
    this.pushTimer = 0;
  }

  update(width: number, height: number): void {
    if (!this.active) return;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    this.state.age += 1;

    let dx = 0, dy = 0;

    switch (this.type) {
      case 'fan':
      case 'cross':
        dx = this.vx;
        dy = this.vy;
        break;

      case 'sine': {
        const perpX = -this.state.baseVy;
        const perpY = this.state.baseVx;
        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
        const nx = perpX / perpLen;
        const ny = perpY / perpLen;
        const sineOffset = Math.sin(this.state.age * this.state.sineFrequency) * this.state.sineAmplitude * 0.02;
        dx = this.vx + nx * sineOffset;
        dy = this.vy + ny * sineOffset;
        break;
      }

      case 'nshape': {
        const phaseTime = 30;
        this.state.nshapeTimer += 1;
        const stage = Math.floor(this.state.nshapeTimer / phaseTime) % 3;
        const progress = (this.state.nshapeTimer % phaseTime) / phaseTime;

        const speed = 3;
        if (stage === 0) {
          dx = this.state.baseVx * speed;
          dy = this.state.baseVy * speed;
        } else if (stage === 1) {
          const turnX = -this.state.baseVy;
          const turnY = this.state.baseVx;
          const t = progress;
          dx = (this.state.baseVx + turnX * t) * speed;
          dy = (this.state.baseVy + turnY * t) * speed;
        } else {
          const turnX = -this.state.baseVy;
          const turnY = this.state.baseVx;
          const t = 1 - progress;
          dx = (this.state.baseVx * (1 - t) + turnX) * speed;
          dy = (this.state.baseVy * (1 - t) + turnY) * speed;
        }
        break;
      }
    }

    if (this.pushTimer > 0) {
      this.pushTimer -= 1;
      const pushFactor = this.pushTimer / 30;
      dx += this.pushedVx * pushFactor;
      dy += this.pushedVy * pushFactor;
    }

    this.x += dx;
    this.y += dy;

    const margin = 50;
    if (
      this.x < -margin || this.x > width + margin ||
      this.y < -margin || this.y > height + margin
    ) {
      this.active = false;
    }
  }

  applyPush(px: number, py: number, duration: number = 30): void {
    this.pushedVx = px;
    this.pushedVy = py;
    this.pushTimer = duration;
  }
}

export class Player {
  x: number;
  y: number;
  radius: number;
  targetX: number;
  targetY: number;
  lives: number;
  maxLives: number;
  shieldActive: boolean;
  shieldOuterRadius: number;
  shieldInnerRadius: number;
  shieldRotation: number;
  shieldRotationSpeed: number;
  shieldFlashTimer: number;
  shieldDestroyed: boolean;
  invincibilityTimer: number;
  glowRadius: number;
  glowPhase: number;
  livesAnimation: { [key: number]: number };
  hitFlashTimer: number;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.radius = 12;
    this.targetX = startX;
    this.targetY = startY;
    this.lives = 3;
    this.maxLives = 3;
    this.shieldActive = true;
    this.shieldOuterRadius = 20;
    this.shieldInnerRadius = 16;
    this.shieldRotation = 0;
    this.shieldRotationSpeed = degToRad(60) / 60;
    this.shieldFlashTimer = 0;
    this.shieldDestroyed = false;
    this.invincibilityTimer = 0;
    this.glowRadius = 15;
    this.glowPhase = 0;
    this.livesAnimation = {};
    this.hitFlashTimer = 0;
  }

  update(mouseX: number, mouseY: number, width: number, height: number): void {
    const margin = 12 + this.radius;
    this.targetX = Math.max(margin, Math.min(width - margin, mouseX));
    this.targetY = Math.max(margin, Math.min(height - margin, mouseY));

    this.x = this.targetX;
    this.y = this.targetY;

    if (this.shieldActive) {
      this.shieldRotation += this.shieldRotationSpeed;
    }

    if (this.shieldFlashTimer > 0) {
      this.shieldFlashTimer -= 1;
    }

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= 1;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= 1;
    }

    this.glowPhase += (2 * Math.PI) / 60;
    this.glowRadius = 15 + 5 * Math.sin(this.glowPhase);

    for (const key in this.livesAnimation) {
      const k = Number(key);
      if (this.livesAnimation[k] > 0) {
        this.livesAnimation[k] -= 1;
      }
    }
  }

  tryShieldHit(bullet: Bullet): boolean {
    if (!this.shieldActive) return false;
    const d = distance(this.x, this.y, bullet.x, bullet.y);
    return d >= this.shieldInnerRadius && d <= this.shieldOuterRadius + bullet.radius;
  }

  tryGraze(bullet: Bullet): boolean {
    if (!this.shieldActive) return false;
    const d = distance(this.x, this.y, bullet.x, bullet.y);
    return d > this.shieldOuterRadius + bullet.radius &&
           d < this.shieldOuterRadius + bullet.radius + 8;
  }

  tryBodyHit(bullet: Bullet): boolean {
    if (this.invincibilityTimer > 0) return false;
    return circleCollision(
      this.x, this.y, this.radius,
      bullet.x, bullet.y, bullet.radius
    );
  }

  takeShieldHit(): void {
    this.shieldFlashTimer = 12;
  }

  destroyShield(): void {
    this.shieldActive = false;
    this.shieldDestroyed = true;
  }

  takeDamage(): void {
    this.lives -= 1;
    this.hitFlashTimer = 18;
    this.invincibilityTimer = 90;
    if (this.lives >= 0 && this.lives < this.maxLives) {
      this.livesAnimation[this.lives] = 18;
    }
  }

  isAlive(): boolean {
    return this.lives > 0;
  }
}

export type EffectType = 'graze' | 'shieldBreak' | 'comboBurst' | 'shockwave' | 'screenFlash' | 'hitFlash';

export class Effect {
  x: number;
  y: number;
  type: EffectType;
  maxRadius: number;
  currentRadius: number;
  alpha: number;
  maxLife: number;
  life: number;
  active: boolean;
  color: string;

  constructor(
    x: number, y: number,
    type: EffectType,
    maxLife: number,
    maxRadius: number = 15,
    color: string = '#FFD700'
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.maxRadius = maxRadius;
    this.currentRadius = type === 'graze' ? 5 : 0;
    this.alpha = 1;
    this.maxLife = maxLife;
    this.life = maxLife;
    this.active = true;
    this.color = color;
  }

  update(): void {
    if (!this.active) return;
    this.life -= 1;
    const t = 1 - this.life / this.maxLife;

    switch (this.type) {
      case 'graze':
        this.currentRadius = 5 + t * (this.maxRadius - 5);
        this.alpha = 1 - t;
        break;
      case 'shieldBreak':
        this.currentRadius = t * this.maxRadius;
        this.alpha = 1 - t;
        break;
      case 'shockwave':
        this.currentRadius = t * this.maxRadius;
        this.alpha = (1 - t) * 0.8;
        break;
      case 'comboBurst':
      case 'screenFlash':
      case 'hitFlash':
        this.alpha = 1 - t;
        break;
    }

    if (this.life <= 0) {
      this.active = false;
    }
  }

  getProgress(): number {
    return 1 - this.life / this.maxLife;
  }
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export const generateStars = (count: number, width: number, height: number): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1 + Math.random(),
      alpha: 0.3 + Math.random() * 0.3
    });
  }
  return stars;
};
