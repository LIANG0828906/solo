import type { Laser } from './collision';
import type { Asteroid, EnergyCapsule } from './types';
import { GAME_CONFIG } from './config';

export class ObjectPool<T extends { active: boolean }> {
  private pool: T[];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 20, maxSize: number = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      const obj = createFn();
      this.resetFn(obj);
      obj.active = false;
      this.pool.push(obj);
    }
  }

  acquire(): T {
    const obj = this.pool.find(o => !o.active);
    if (obj) {
      this.resetFn(obj);
      obj.active = true;
      return obj;
    }
    if (this.pool.length < this.maxSize) {
      const newObj = this.createFn();
      this.resetFn(newObj);
      newObj.active = true;
      this.pool.push(newObj);
      return newObj;
    }
    const oldest = this.pool.find(o => !o.active);
    const target = oldest || this.pool[0];
    this.resetFn(target);
    target.active = true;
    return target;
  }

  release(obj: T): void {
    this.resetFn(obj);
    obj.active = false;
  }

  getActive(): T[] {
    return this.pool.filter(o => o.active);
  }

  getAll(): T[] {
    return this.pool;
  }

  resetAll(): void {
    for (const obj of this.pool) {
      this.resetFn(obj);
      obj.active = false;
    }
  }
}

export function createLaserPool(): ObjectPool<Laser> {
  return new ObjectPool<Laser>(
    () => ({
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      length: GAME_CONFIG.LASER.LENGTH,
      width: GAME_CONFIG.LASER.WIDTH,
      active: false
    }),
    (laser) => {
      laser.x = 0;
      laser.y = 0;
      laser.dx = 0;
      laser.dy = 0;
      laser.length = GAME_CONFIG.LASER.LENGTH;
      laser.width = GAME_CONFIG.LASER.WIDTH;
      laser.active = false;
    },
    30,
    100
  );
}

export function createAsteroidPool(): ObjectPool<Asteroid> {
  return new ObjectPool<Asteroid>(
    () => ({
      id: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      isFragment: false,
      active: false,
      rotation: 0,
      rotationSpeed: 0
    }),
    (asteroid) => {
      asteroid.id = 0;
      asteroid.x = 0;
      asteroid.y = 0;
      asteroid.vx = 0;
      asteroid.vy = 0;
      asteroid.radius = 0;
      asteroid.isFragment = false;
      asteroid.active = false;
      asteroid.rotation = 0;
      asteroid.rotationSpeed = 0;
    },
    20,
    60
  );
}

export function createCapsulePool(): ObjectPool<EnergyCapsule> {
  return new ObjectPool<EnergyCapsule>(
    () => ({
      id: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: GAME_CONFIG.CAPSULE.RADIUS,
      active: false
    }),
    (capsule) => {
      capsule.id = 0;
      capsule.x = 0;
      capsule.y = 0;
      capsule.vx = 0;
      capsule.vy = 0;
      capsule.radius = GAME_CONFIG.CAPSULE.RADIUS;
      capsule.active = false;
    },
    10,
    30
  );
}
