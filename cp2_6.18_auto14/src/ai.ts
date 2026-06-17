import type { Laser } from './collision';
import { ObjectPool } from './objectPool';
import type { AITeammate, Asteroid } from './types';
import { GAME_CONFIG } from './config';

const AI_COLORS: readonly string[] = GAME_CONFIG.AI.COLORS;

export class AIManager {
  private teammates: AITeammate[];
  private laserPool: ObjectPool<Laser>;
  private canvasWidth: number;
  private canvasHeight: number;
  private fireCooldown: number;
  private aiSpeed: number;
  private broadcastTargetPosition: { x: number; y: number } | null;
  private broadcastTargetTimer: number;
  private broadcastTargetDuration: number;
  private broadcastResponseRange: number;

  constructor(
    laserPool: ObjectPool<Laser>,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.laserPool = laserPool;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.teammates = [];
    this.fireCooldown = GAME_CONFIG.AI.FIRE_COOLDOWN;
    this.aiSpeed = GAME_CONFIG.AI.SPEED;
    this.broadcastTargetPosition = null;
    this.broadcastTargetTimer = 0;
    this.broadcastTargetDuration = GAME_CONFIG.AI.BROADCAST_RESPONSE_DURATION;
    this.broadcastResponseRange = GAME_CONFIG.AI.BROADCAST_RESPONSE_RANGE;

    this.initTeammates(GAME_CONFIG.AI.COUNT);
  }

  private initTeammates(count: number): void {
    for (let i = 0; i < count; i++) {
      const color = AI_COLORS[i % AI_COLORS.length];
      this.teammates.push({
        id: i,
        x: 200 + i * 100,
        y: 150 + i * 80,
        color: color,
        targetId: null,
        fireCooldown: 0,
        angle: 0
      });
    }
  }

  update(
    deltaTime: number,
    currentTime: number,
    asteroids: Asteroid[],
    playerX: number,
    playerY: number,
    broadcastPosition: { x: number; y: number } | null
  ): void {
    if (broadcastPosition) {
      this.broadcastTargetPosition = { ...broadcastPosition };
      this.broadcastTargetTimer = this.broadcastTargetDuration;
    }

    if (this.broadcastTargetTimer > 0) {
      this.broadcastTargetTimer -= deltaTime;
      if (this.broadcastTargetTimer <= 0) {
        this.broadcastTargetPosition = null;
      }
    }

    for (const teammate of this.teammates) {
      teammate.fireCooldown -= deltaTime;

      let target: Asteroid | null = null;

      if (this.broadcastTargetPosition) {
        target = this.findNearestAsteroidNearPoint(
          asteroids,
          this.broadcastTargetPosition.x,
          this.broadcastTargetPosition.y,
          this.broadcastResponseRange
        );
      }

      if (!target) {
        target = this.findNearestAsteroid(asteroids, teammate.x, teammate.y);
      }

      if (target) {
        teammate.targetId = target.id;

        const dx = target.x - teammate.x;
        const dy = target.y - teammate.y;
        const targetAngle = Math.atan2(dy, dx);
        teammate.angle = targetAngle;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 200) {
          const moveSpeed = this.aiSpeed * (deltaTime / 16.67);
          teammate.x += Math.cos(targetAngle) * moveSpeed;
          teammate.y += Math.sin(targetAngle) * moveSpeed;
        } else if (dist < 100) {
          const moveSpeed = this.aiSpeed * 0.5 * (deltaTime / 16.67);
          teammate.x -= Math.cos(targetAngle) * moveSpeed;
          teammate.y -= Math.sin(targetAngle) * moveSpeed;
        }

        if (teammate.fireCooldown <= 0 && dist < 300) {
          this.fireLaser(teammate);
          teammate.fireCooldown = this.fireCooldown + Math.random() * 400;
        }
      } else {
        teammate.targetId = null;
        const wanderAngle = currentTime * 0.001 + teammate.id * 2;
        const wanderX = 300 + Math.sin(wanderAngle) * 150;
        const wanderY = 200 + Math.cos(wanderAngle * 0.7) * 100;
        const dx = wanderX - teammate.x;
        const dy = wanderY - teammate.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          const moveSpeed = this.aiSpeed * 0.5 * (deltaTime / 16.67);
          teammate.x += (dx / dist) * moveSpeed;
          teammate.y += (dy / dist) * moveSpeed;
          teammate.angle = Math.atan2(dy, dx);
        }
      }

      const shipRadius = 12;
      teammate.x = Math.max(shipRadius, Math.min(this.canvasWidth - shipRadius, teammate.x));
      teammate.y = Math.max(shipRadius, Math.min(this.canvasHeight - shipRadius, teammate.y));
    }
  }

  private findNearestAsteroid(asteroids: Asteroid[], x: number, y: number): Asteroid | null {
    let nearest: Asteroid | null = null;
    let minDist = Infinity;

    for (const asteroid of asteroids) {
      if (!asteroid.active) continue;
      const dx = asteroid.x - x;
      const dy = asteroid.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = asteroid;
      }
    }

    return nearest;
  }

  private findNearestAsteroidNearPoint(
    asteroids: Asteroid[],
    px: number,
    py: number,
    range: number
  ): Asteroid | null {
    let nearest: Asteroid | null = null;
    let minDist = Infinity;

    for (const asteroid of asteroids) {
      if (!asteroid.active) continue;
      const dx = asteroid.x - px;
      const dy = asteroid.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < range && dist < minDist) {
        minDist = dist;
        nearest = asteroid;
      }
    }

    return nearest;
  }

  private fireLaser(teammate: AITeammate): void {
    const laser = this.laserPool.acquire();
    laser.x = teammate.x;
    laser.y = teammate.y;
    laser.dx = Math.cos(teammate.angle);
    laser.dy = Math.sin(teammate.angle);
    laser.length = GAME_CONFIG.AI.LASER_LENGTH;
    laser.width = GAME_CONFIG.AI.LASER_WIDTH;
    laser.active = true;
  }

  getTeammates(): AITeammate[] {
    return this.teammates;
  }

  validateColors(): boolean {
    if (this.teammates.length < 3) return false;
    const expectedColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
    for (let i = 0; i < 3; i++) {
      if (this.teammates[i].color !== expectedColors[i]) {
        return false;
      }
    }
    return true;
  }

  reset(): void {
    for (let i = 0; i < this.teammates.length; i++) {
      this.teammates[i].x = 200 + i * 100;
      this.teammates[i].y = 150 + i * 80;
      this.teammates[i].targetId = null;
      this.teammates[i].fireCooldown = 0;
      this.teammates[i].angle = 0;
      this.teammates[i].color = AI_COLORS[i % AI_COLORS.length];
    }
    this.broadcastTargetPosition = null;
    this.broadcastTargetTimer = 0;
  }
}
