import type { ArenaState, Obstacle } from './types';

const INITIAL_DIAMETER = 600;
const MIN_DIAMETER = 200;
const SHRINK_INTERVAL = 15;
const SHRINK_RATE = 0.05;
const EDGE_FLASH_INTERVAL = 0.8;

const OBSTACLE_MIN_RADIUS = 20;
const OBSTACLE_MAX_RADIUS = 35;
const OBSTACLE_MIN_INTERVAL = 5;
const OBSTACLE_MAX_INTERVAL = 8;

export class Arena {
  state: ArenaState;
  private obstacles: Obstacle[] = [];
  private nextObstacleId: number = 0;
  private obstacleTimer: number = 0;
  private nextObstacleInterval: number = 0;

  constructor(centerX: number, centerY: number) {
    this.state = {
      centerX,
      centerY,
      diameter: INITIAL_DIAMETER,
      initialDiameter: INITIAL_DIAMETER,
      minDiameter: MIN_DIAMETER,
      shrinkInterval: SHRINK_INTERVAL,
      shrinkRate: SHRINK_RATE,
      shrinkTimer: 0,
      edgeFlashTimer: 0,
      edgeFlashInterval: EDGE_FLASH_INTERVAL,
      edgeFlashOn: true,
    };
    this.nextObstacleInterval = this.randomObstacleInterval();
  }

  update(deltaTime: number): void {
    const state = this.state;

    state.shrinkTimer += deltaTime;
    if (state.shrinkTimer >= state.shrinkInterval) {
      state.shrinkTimer = 0;
      const newDiameter = state.diameter * (1 - state.shrinkRate);
      state.diameter = Math.max(newDiameter, state.minDiameter);
      this.removeObstaclesOutside();
    }

    state.edgeFlashTimer += deltaTime;
    if (state.edgeFlashTimer >= state.edgeFlashInterval) {
      state.edgeFlashTimer = 0;
      state.edgeFlashOn = !state.edgeFlashOn;
    }

    this.obstacleTimer += deltaTime;
    if (this.obstacleTimer >= this.nextObstacleInterval) {
      this.obstacleTimer = 0;
      this.nextObstacleInterval = this.randomObstacleInterval();
      this.spawnObstacle();
    }
  }

  private randomObstacleInterval(): number {
    return OBSTACLE_MIN_INTERVAL + Math.random() * (OBSTACLE_MAX_INTERVAL - OBSTACLE_MIN_INTERVAL);
  }

  private spawnObstacle(): void {
    const state = this.state;
    const radius = OBSTACLE_MIN_RADIUS + Math.random() * (OBSTACLE_MAX_RADIUS - OBSTACLE_MIN_RADIUS);
    const maxDist = state.diameter / 2 - radius - 10;

    if (maxDist <= 0) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * maxDist;

    const x = state.centerX + Math.cos(angle) * dist;
    const y = state.centerY + Math.sin(angle) * dist;

    this.obstacles.push({
      id: this.nextObstacleId++,
      x,
      y,
      radius,
    });
  }

  private removeObstaclesOutside(): void {
    const state = this.state;
    const radius = state.diameter / 2;

    this.obstacles = this.obstacles.filter(obs => {
      const dx = obs.x - state.centerX;
      const dy = obs.y - state.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist + obs.radius <= radius;
    });
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  isOnPlatform(x: number, y: number, margin: number = 0): boolean {
    const state = this.state;
    const dx = x - state.centerX;
    const dy = y - state.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= state.diameter / 2 - margin;
  }

  checkCarCollision(carX: number, carY: number, carRadius: number): Obstacle | null {
    for (const obs of this.obstacles) {
      const dx = carX - obs.x;
      const dy = carY - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < carRadius + obs.radius) {
        return obs;
      }
    }
    return null;
  }

  getDiameterPercent(): number {
    const state = this.state;
    return ((state.diameter - state.minDiameter) / (state.initialDiameter - state.minDiameter)) * 100;
  }

  reset(): void {
    const state = this.state;
    state.diameter = state.initialDiameter;
    state.shrinkTimer = 0;
    state.edgeFlashTimer = 0;
    state.edgeFlashOn = true;
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleId = 0;
    this.nextObstacleInterval = this.randomObstacleInterval();
  }
}
