import type { Laser } from './collision';
import { laserCircleCollision } from './collision';
import { ObjectPool } from './objectPool';
import type { Asteroid, EnergyCapsule } from './types';
import { GAME_CONFIG } from './config';

let asteroidIdCounter = 0;
let capsuleIdCounter = 0;

export class EnemyManager {
  private asteroidPool: ObjectPool<Asteroid>;
  private capsulePool: ObjectPool<EnergyCapsule>;
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnTimer: number;
  private spawnInterval: number;
  private minAsteroidRadius: number;
  private maxAsteroidRadius: number;
  private minSpeed: number;
  private maxSpeed: number;

  constructor(
    asteroidPool: ObjectPool<Asteroid>,
    capsulePool: ObjectPool<EnergyCapsule>,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.asteroidPool = asteroidPool;
    this.capsulePool = capsulePool;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.spawnTimer = 0;
    this.spawnInterval = GAME_CONFIG.ASTEROID.SPAWN_INTERVAL;
    this.minAsteroidRadius = GAME_CONFIG.ASTEROID.MIN_RADIUS;
    this.maxAsteroidRadius = GAME_CONFIG.ASTEROID.MAX_RADIUS;
    this.minSpeed = GAME_CONFIG.ASTEROID.MIN_SPEED;
    this.maxSpeed = GAME_CONFIG.ASTEROID.MAX_SPEED;
  }

  update(deltaTime: number): void {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnAsteroid();
    }

    const asteroids = this.asteroidPool.getActive();
    for (const asteroid of asteroids) {
      asteroid.x += asteroid.vx * (deltaTime / 16.67);
      asteroid.y += asteroid.vy * (deltaTime / 16.67);
      asteroid.rotation += asteroid.rotationSpeed * (deltaTime / 16.67);

      if (
        asteroid.x + asteroid.radius < -50 ||
        asteroid.x - asteroid.radius > this.canvasWidth + 50 ||
        asteroid.y + asteroid.radius < -50 ||
        asteroid.y - asteroid.radius > this.canvasHeight + 50
      ) {
        this.asteroidPool.release(asteroid);
      }
    }

    const capsules = this.capsulePool.getActive();
    for (const capsule of capsules) {
      capsule.x += capsule.vx * (deltaTime / 16.67);
      capsule.y += capsule.vy * (deltaTime / 16.67);

      if (
        capsule.x + capsule.radius < -20 ||
        capsule.x - capsule.radius > this.canvasWidth + 20 ||
        capsule.y + capsule.radius < -20 ||
        capsule.y - capsule.radius > this.canvasHeight + 20
      ) {
        this.capsulePool.release(capsule);
      }
    }
  }

  private spawnAsteroid(): void {
    const asteroid = this.asteroidPool.acquire();
    asteroid.id = ++asteroidIdCounter;
    asteroid.radius = this.minAsteroidRadius + Math.random() * (this.maxAsteroidRadius - this.minAsteroidRadius);
    asteroid.x = this.canvasWidth + asteroid.radius;
    asteroid.y = asteroid.radius + Math.random() * (this.canvasHeight - asteroid.radius * 2);

    const speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
    const angle = (Math.random() - 0.5) * 0.5;
    asteroid.vx = -speed * Math.cos(angle);
    asteroid.vy = speed * Math.sin(angle);

    asteroid.isFragment = false;
    asteroid.rotation = Math.random() * Math.PI * 2;
    asteroid.rotationSpeed = (Math.random() - 0.5) * 0.1;
    asteroid.active = true;
  }

  spawnFragment(x: number, y: number, radius: number, vx: number, vy: number): void {
    const asteroid = this.asteroidPool.acquire();
    asteroid.id = ++asteroidIdCounter;
    asteroid.x = x;
    asteroid.y = y;
    asteroid.radius = radius;
    asteroid.vx = vx;
    asteroid.vy = vy;
    asteroid.isFragment = true;
    asteroid.rotation = Math.random() * Math.PI * 2;
    asteroid.rotationSpeed = (Math.random() - 0.5) * 0.2;
    asteroid.active = true;
  }

  spawnCapsule(x: number, y: number): void {
    const capsule = this.capsulePool.acquire();
    capsule.id = ++capsuleIdCounter;
    capsule.x = x;
    capsule.y = y;
    capsule.vx = -0.5;
    capsule.vy = (Math.random() - 0.5) * 0.5;
    capsule.radius = GAME_CONFIG.CAPSULE.RADIUS;
    capsule.active = true;
  }

  checkLaserCollisions(lasers: Laser[]): { score: number; destroyed: Asteroid[] } {
    let score = 0;
    const destroyed: Asteroid[] = [];
    const activeAsteroids = this.asteroidPool.getActive();

    for (const laser of lasers) {
      if (!laser.active) continue;

      for (const asteroid of activeAsteroids) {
        if (!asteroid.active) continue;

        if (laserCircleCollision(laser, { x: asteroid.x, y: asteroid.y, radius: asteroid.radius })) {
          laser.active = false;
          destroyed.push(asteroid);
          this.destroyAsteroid(asteroid);
          score += asteroid.isFragment ? GAME_CONFIG.ASTEROID.SCORE_FRAGMENT : GAME_CONFIG.ASTEROID.SCORE_MOTHER;
          break;
        }
      }
    }

    return { score, destroyed };
  }

  private destroyAsteroid(asteroid: Asteroid): void {
    if (!asteroid.isFragment) {
      const fragmentRadius = asteroid.radius / 2;

      if (fragmentRadius >= GAME_CONFIG.ASTEROID.MIN_FRAGMENT_RADIUS) {
        const speed = Math.sqrt(asteroid.vx * asteroid.vx + asteroid.vy * asteroid.vy);

        const angle1 = Math.atan2(asteroid.vy, asteroid.vx) + Math.PI / 4;
        const angle2 = Math.atan2(asteroid.vy, asteroid.vx) - Math.PI / 4;

        this.spawnFragment(
          asteroid.x,
          asteroid.y,
          fragmentRadius,
          Math.cos(angle1) * speed * 1.2,
          Math.sin(angle1) * speed * 1.2
        );
        this.spawnFragment(
          asteroid.x,
          asteroid.y,
          fragmentRadius,
          Math.cos(angle2) * speed * 1.2,
          Math.sin(angle2) * speed * 1.2
        );
      }

      if (Math.random() < GAME_CONFIG.CAPSULE.DROP_PROBABILITY) {
        this.spawnCapsule(asteroid.x, asteroid.y);
      }
    }

    this.asteroidPool.release(asteroid);
  }

  getAsteroids(): Asteroid[] {
    return this.asteroidPool.getActive();
  }

  getCapsules(): EnergyCapsule[] {
    return this.capsulePool.getActive();
  }

  collectCapsule(capsule: EnergyCapsule): void {
    this.capsulePool.release(capsule);
  }

  reset(): void {
    this.asteroidPool.resetAll();
    this.capsulePool.resetAll();
    this.spawnTimer = 0;
  }
}
