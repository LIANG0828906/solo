import type { Laser } from './collision';
import type { Asteroid, EnergyCapsule } from './types';

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
      newObj.active = true;
      this.pool.push(newObj);
      return newObj;
    }
    const oldest = this.pool.find(o => !o.active) || this.pool[0];
    this.resetFn(oldest);
    oldest.active = true;
    return oldest;
  }

  release(obj: T): void {
    obj.active = false;
  }

  getActive(): T[] {
    return this.pool.filter(o => o.active);
  }

  getAll(): T[] {
    return this.pool;
  }
}

export function createLaserPool(): ObjectPool<Laser> {
  return new ObjectPool<Laser>(
    () => ({
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      length: 20,
      width: 4,
      active: false
    }),
    (laser) => {
      laser.x = 0;
      laser.y = 0;
      laser.dx = 0;
      laser.dy = 0;
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
      radius: 6,
      active: false
    }),
    (capsule) => {
      capsule.id = 0;
      capsule.x = 0;
      capsule.y = 0;
      capsule.vx = 0;
      capsule.vy = 0;
      capsule.radius = 6;
      capsule.active = false;
    },
    10,
    30
  );
}
