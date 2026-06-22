export type Direction = 'up' | 'down' | 'left' | 'right';
export type PowerUpType = 'shield' | 'speed' | 'rapidFire' | 'mine';
export type GameState = 'menu' | 'countdown' | 'playing' | 'roundEnd' | 'victory';

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export const TANK_SIZE = 40;
export const TANK_SPEED = 3;
export const TANK_FIRE_COOLDOWN = 1500;
export const BULLET_RADIUS = 5;
export const BULLET_SPEED = 8;
export const BRICK_WIDTH = 48;
export const BRICK_HEIGHT = 24;
export const POWERUP_SIZE = 24;
export const MINE_RADIUS = 12;
export const EXPLOSION_RADIUS = 60;
export const STUN_DURATION = 2000;
export const SHIELD_DURATION = 5000;
export const SPEED_DURATION = 8000;
export const RAPID_FIRE_DURATION = 8000;
export const WIN_SCORE = 4;

export class Tank {
  x: number;
  y: number;
  width: number = TANK_SIZE;
  height: number = TANK_SIZE;
  direction: Direction;
  speed: number = TANK_SPEED;
  color: string;
  playerId: 1 | 2;
  lastFireTime: number = 0;
  fireCooldown: number = TANK_FIRE_COOLDOWN;
  shieldActive: boolean = false;
  shieldEndTime: number = 0;
  speedBoostActive: boolean = false;
  speedBoostEndTime: number = 0;
  rapidFireActive: boolean = false;
  rapidFireEndTime: number = 0;
  stunned: boolean = false;
  stunEndTime: number = 0;
  pickupAnimation: number = 0;
  victoryRotation: number = 0;

  constructor(x: number, y: number, direction: Direction, color: string, playerId: 1 | 2) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.color = color;
    this.playerId = playerId;
  }

  getCenterX(): number {
    return this.x + this.width / 2;
  }

  getCenterY(): number {
    return this.y + this.height / 2;
  }

  getRadius(): number {
    return Math.min(this.width, this.height) / 2;
  }

  updateTimers(currentTime: number): void {
    if (this.shieldActive && currentTime > this.shieldEndTime) {
      this.shieldActive = false;
    }
    if (this.speedBoostActive && currentTime > this.speedBoostEndTime) {
      this.speedBoostActive = false;
    }
    if (this.rapidFireActive && currentTime > this.rapidFireEndTime) {
      this.rapidFireActive = false;
      this.fireCooldown = TANK_FIRE_COOLDOWN;
    }
    if (this.stunned && currentTime > this.stunEndTime) {
      this.stunned = false;
    }
    if (this.pickupAnimation > 0) {
      this.pickupAnimation = Math.max(0, this.pickupAnimation - 16);
    }
  }

  getCurrentSpeed(): number {
    return this.speedBoostActive ? this.speed * 2 : this.speed;
  }

  getCurrentCooldown(): number {
    return this.rapidFireActive ? 500 : this.fireCooldown;
  }

  canFire(currentTime: number): boolean {
    return currentTime - this.lastFireTime >= this.getCurrentCooldown() && !this.stunned;
  }

  activateShield(currentTime: number): void {
    this.shieldActive = true;
    this.shieldEndTime = currentTime + SHIELD_DURATION;
  }

  activateSpeedBoost(currentTime: number): void {
    this.speedBoostActive = true;
    this.speedBoostEndTime = currentTime + SPEED_DURATION;
  }

  activateRapidFire(currentTime: number): void {
    this.rapidFireActive = true;
    this.rapidFireEndTime = currentTime + RAPID_FIRE_DURATION;
  }

  stun(currentTime: number): void {
    this.stunned = true;
    this.stunEndTime = currentTime + STUN_DURATION;
  }

  triggerPickupAnimation(): void {
    this.pickupAnimation = 200;
  }
}

export class Bullet {
  x: number;
  y: number;
  radius: number = BULLET_RADIUS;
  speed: number = BULLET_SPEED;
  direction: Direction;
  ownerId: 1 | 2;
  trail: Array<{ x: number; y: number }> = [];

  constructor(x: number, y: number, direction: Direction, ownerId: 1 | 2) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.ownerId = ownerId;
  }

  update(): void {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) {
      this.trail.shift();
    }

    switch (this.direction) {
      case 'up':
        this.y -= this.speed;
        break;
      case 'down':
        this.y += this.speed;
        break;
      case 'left':
        this.x -= this.speed;
        break;
      case 'right':
        this.x += this.speed;
        break;
    }
  }

  isOutOfBounds(): boolean {
    return this.x < 0 || this.x > MAP_WIDTH || this.y < 0 || this.y > MAP_HEIGHT;
  }
}

export class Brick {
  x: number;
  y: number;
  width: number = BRICK_WIDTH;
  height: number = BRICK_HEIGHT;
  health: number = 1;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getCenterX(): number {
    return this.x + this.width / 2;
  }

  getCenterY(): number {
    return this.y + this.height / 2;
  }

  getRadius(): number {
    return Math.min(this.width, this.height) / 2;
  }
}

export class PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  size: number = POWERUP_SIZE;
  spawnTime: number;
  collected: boolean = false;

  constructor(x: number, y: number, type: PowerUpType, spawnTime: number) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.spawnTime = spawnTime;
  }

  getCenterX(): number {
    return this.x + this.size / 2;
  }

  getCenterY(): number {
    return this.y + this.size / 2;
  }

  getRadius(): number {
    return this.size / 2;
  }

  getPulseOpacity(currentTime: number): number {
    const elapsed = currentTime - this.spawnTime;
    const phase = (elapsed % 2000) / 2000;
    return 0.3 + 0.7 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
  }
}

export class Mine {
  x: number;
  y: number;
  radius: number = MINE_RADIUS;
  ownerId: 1 | 2;
  armed: boolean = false;
  armedTime: number;

  constructor(x: number, y: number, ownerId: 1 | 2, currentTime: number) {
    this.x = x;
    this.y = y;
    this.ownerId = ownerId;
    this.armedTime = currentTime + 500;
  }

  checkArmed(currentTime: number): void {
    if (!this.armed && currentTime > this.armedTime) {
      this.armed = true;
    }
  }
}

export class Base {
  x: number;
  y: number;
  size: number = 40;
  playerId: 1 | 2;

  constructor(x: number, y: number, playerId: 1 | 2) {
    this.x = x;
    this.y = y;
    this.playerId = playerId;
  }

  getCenterX(): number {
    return this.x + this.size / 2;
  }

  getCenterY(): number {
    return this.y + this.size / 2;
  }

  getRadius(): number {
    return this.size / 2;
  }
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, size: number, duration: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = duration;
    this.maxLife = duration;
  }

  update(deltaTime: number): boolean {
    this.x += this.vx * (deltaTime / 16);
    this.y += this.vy * (deltaTime / 16);
    this.vy += 0.1 * (deltaTime / 16);
    this.life -= deltaTime;
    return this.life > 0;
  }

  getOpacity(): number {
    return Math.max(0, this.life / this.maxLife);
  }
}

export class PickupText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number = 1000;
  startY: number;

  constructor(x: number, y: number, text: string, color: string) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.text = text;
    this.color = color;
    this.life = this.maxLife;
  }

  update(deltaTime: number): boolean {
    this.life -= deltaTime;
    const progress = 1 - this.life / this.maxLife;
    this.y = this.startY - 30 * Math.sin(progress * Math.PI);
    return this.life > 0;
  }

  getOpacity(): number {
    return Math.max(0, this.life / this.maxLife);
  }
}

export class Star {
  x: number;
  y: number;
  size: number = 3;
  speed: number = 0.5;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number): void {
    this.x += this.speed * (deltaTime / 16);
    this.y += this.speed * (deltaTime / 16);
    if (this.x > MAP_WIDTH) this.x = 0;
    if (this.y > MAP_HEIGHT) this.y = 0;
  }
}

export function circleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = r1 + r2;
  return distanceSquared < radiusSum * radiusSum;
}

export function rectVsCircleCollision(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  cx: number,
  cy: number,
  cr: number
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}
