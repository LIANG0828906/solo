import type { Laser } from './collision';
import { ObjectPool } from './objectPool';
import type { BroadcastSignal } from './types';

export interface PlayerConfig {
  startX: number;
  startY: number;
  speed: number;
  maxEnergy: number;
  laserSpeed: number;
  laserLength: number;
  laserWidth: number;
  fireCooldown: number;
}

export class Player {
  x: number;
  y: number;
  angle: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  laserSpeed: number;
  laserLength: number;
  laserWidth: number;
  fireCooldown: number;
  lastFireTime: number;
  private laserPool: ObjectPool<Laser>;
  private keys: Set<string>;
  private canvasWidth: number;
  private canvasHeight: number;
  private broadcastSignal: BroadcastSignal | null;
  private broadcastCooldown: number;
  private lastBroadcastTime: number;

  constructor(
    config: PlayerConfig,
    laserPool: ObjectPool<Laser>,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.x = config.startX;
    this.y = config.startY;
    this.angle = 0;
    this.energy = config.maxEnergy;
    this.maxEnergy = config.maxEnergy;
    this.speed = config.speed;
    this.laserSpeed = config.laserSpeed;
    this.laserLength = config.laserLength;
    this.laserWidth = config.laserWidth;
    this.fireCooldown = config.fireCooldown;
    this.lastFireTime = 0;
    this.laserPool = laserPool;
    this.keys = new Set();
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.broadcastSignal = null;
    this.broadcastCooldown = 2000;
    this.lastBroadcastTime = 0;
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key.toLowerCase());
    } else {
      this.keys.delete(key.toLowerCase());
    }
  }

  update(deltaTime: number, currentTime: number): void {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) {
      dy -= 1;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      dy += 1;
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      dx -= 1;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      dx += 1;
    }

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
      this.angle = Math.atan2(dy, dx);
    }

    const moveSpeed = this.speed * (deltaTime / 16.67);
    this.x += dx * moveSpeed;
    this.y += dy * moveSpeed;

    const shipRadius = 15;
    this.x = Math.max(shipRadius, Math.min(this.canvasWidth - shipRadius, this.x));
    this.y = Math.max(shipRadius, Math.min(this.canvasHeight - shipRadius, this.y));

    if (this.keys.has(' ') || this.keys.has('space')) {
      this.fire(currentTime);
    }

    if (this.keys.has('b')) {
      this.broadcast(currentTime);
    }

    if (this.broadcastSignal && this.broadcastSignal.active) {
      this.broadcastSignal.elapsed += deltaTime;
      const progress = this.broadcastSignal.elapsed / this.broadcastSignal.duration;
      this.broadcastSignal.radius = this.broadcastSignal.maxRadius * Math.sin(progress * Math.PI);
      if (this.broadcastSignal.elapsed >= this.broadcastSignal.duration) {
        this.broadcastSignal.active = false;
      }
    }
  }

  fire(currentTime: number): void {
    if (currentTime - this.lastFireTime < this.fireCooldown) {
      return;
    }
    if (this.energy < 1) {
      return;
    }

    this.lastFireTime = currentTime;

    const laser = this.laserPool.acquire();
    laser.x = this.x;
    laser.y = this.y;
    laser.dx = Math.cos(this.angle);
    laser.dy = Math.sin(this.angle);
    laser.length = this.laserLength;
    laser.width = this.laserWidth;
    laser.active = true;
  }

  broadcast(currentTime: number): void {
    if (currentTime - this.lastBroadcastTime < this.broadcastCooldown) {
      return;
    }

    this.lastBroadcastTime = currentTime;

    this.broadcastSignal = {
      x: this.x,
      y: this.y,
      radius: 0,
      maxRadius: 40,
      duration: 300,
      elapsed: 0,
      active: true
    };
  }

  getBroadcastSignal(): BroadcastSignal | null {
    return this.broadcastSignal && this.broadcastSignal.active ? this.broadcastSignal : null;
  }

  getBroadcastPosition(): { x: number; y: number } | null {
    return this.broadcastSignal && this.broadcastSignal.active
      ? { x: this.broadcastSignal.x, y: this.broadcastSignal.y }
      : null;
  }

  addEnergy(amount: number): void {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  consumeEnergy(amount: number): void {
    this.energy = Math.max(0, this.energy - amount);
  }

  reset(): void {
    this.x = 100;
    this.y = 500;
    this.angle = 0;
    this.energy = this.maxEnergy;
    this.lastFireTime = 0;
    this.lastBroadcastTime = 0;
    this.broadcastSignal = null;
    this.keys.clear();
  }
}
