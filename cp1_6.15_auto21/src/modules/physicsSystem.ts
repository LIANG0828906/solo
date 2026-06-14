import {
  IPhysicsBody,
  COLLISION_RADIUS,
  PHYSICS_DAMPING,
  COLLISION_FORCE_MULTIPLIER,
  SPRING_STIFFNESS
} from '../models/buildingConfig';

export interface ICollisionEvent<T extends IPhysicsBody> {
  bodyA: T;
  bodyB: T;
  overlap: number;
  normal: { x: number; z: number };
}

export interface IPhysicsBodyExtended extends IPhysicsBody {
  id: string;
  isStatic: boolean;
  restitution?: number;
}

export class PhysicsSystem<T extends IPhysicsBodyExtended = IPhysicsBodyExtended> {
  private bodies: T[] = [];
  private collisionRadius: number;
  private damping: number;
  private forceMultiplier: number;
  private springStiffness: number;
  private maxVelocity: number = 2;
  private collisionListeners: Array<(event: ICollisionEvent<T>) => void> = [];

  constructor(
    collisionRadius: number = COLLISION_RADIUS,
    damping: number = PHYSICS_DAMPING,
    forceMultiplier: number = COLLISION_FORCE_MULTIPLIER,
    springStiffness: number = SPRING_STIFFNESS
  ) {
    this.collisionRadius = collisionRadius;
    this.damping = damping;
    this.forceMultiplier = forceMultiplier;
    this.springStiffness = springStiffness;
  }

  addBody(body: T): void {
    this.bodies.push(body);
  }

  removeBody(body: T): void {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  removeBodyById(id: string): void {
    const index = this.bodies.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  getBodies(): T[] {
    return this.bodies;
  }

  getBodyById(id: string): T | undefined {
    return this.bodies.find(b => b.id === id);
  }

  setCollisionRadius(radius: number): void {
    this.collisionRadius = Math.max(0.1, radius);
  }

  setDamping(damping: number): void {
    this.damping = Math.max(0, Math.min(1, damping));
  }

  setForceMultiplier(multiplier: number): void {
    this.forceMultiplier = Math.max(0, multiplier);
  }

  setSpringStiffness(stiffness: number): void {
    this.springStiffness = Math.max(0, stiffness);
  }

  setMaxVelocity(max: number): void {
    this.maxVelocity = Math.max(0, max);
  }

  onCollision(listener: (event: ICollisionEvent<T>) => void): () => void {
    this.collisionListeners.push(listener);
    return () => {
      const index = this.collisionListeners.indexOf(listener);
      if (index !== -1) {
        this.collisionListeners.splice(index, 1);
      }
    };
  }

  update(deltaTime: number): void {
    if (this.bodies.length < 2) return;

    const dt = Math.min(deltaTime, 0.1);

    this.integrate(dt);
    this.resolveCollisions();
    this.applyDamping();
    this.clampVelocity();
  }

  private integrate(dt: number): void {
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      body.position.x += body.velocity.x * dt;
      body.position.z += body.velocity.z * dt;
    }
  }

  private resolveCollisions(): void {
    const collisions: ICollisionEvent<T>[] = [];

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        const collision = this.checkCircleCollision(bodyA, bodyB);
        if (collision) {
          collisions.push(collision);
          this.resolveSpringDampingCollision(collision);
        }
      }
    }

    for (const collision of collisions) {
      this.notifyCollisionListeners(collision);
    }
  }

  checkCircleCollision(bodyA: T, bodyB: T): ICollisionEvent<T> | null {
    const dx = bodyB.position.x - bodyA.position.x;
    const dz = bodyB.position.z - bodyA.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    const minDistance = bodyA.collisionRadius + bodyB.collisionRadius;

    if (distance < minDistance && distance > 0) {
      const overlap = minDistance - distance;
      const normal = {
        x: dx / distance,
        z: dz / distance
      };

      return {
        bodyA,
        bodyB,
        overlap,
        normal
      };
    }

    return null;
  }

  private resolveSpringDampingCollision(collision: ICollisionEvent<T>): void {
    const { bodyA, bodyB, overlap, normal } = collision;

    const springForce = overlap * this.springStiffness * this.forceMultiplier;

    const relativeVelocity = {
      x: bodyB.velocity.x - bodyA.velocity.x,
      z: bodyB.velocity.z - bodyA.velocity.z
    };

    const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.z * normal.z;

    if (velocityAlongNormal > 0) return;

    const dampingForce = velocityAlongNormal * (1 - this.damping);

    const totalForce = springForce - dampingForce;

    const massA = bodyA.mass || 1;
    const massB = bodyB.mass || 1;
    const totalMass = massA + massB;

    const impulseA = totalForce * (massB / totalMass);
    const impulseB = totalForce * (massA / totalMass);

    if (!bodyA.isStatic) {
      bodyA.velocity.x -= normal.x * impulseA;
      bodyA.velocity.z -= normal.z * impulseA;

      const separation = overlap * (massB / totalMass) * 0.5;
      bodyA.position.x -= normal.x * separation;
      bodyA.position.z -= normal.z * separation;
    }

    if (!bodyB.isStatic) {
      bodyB.velocity.x += normal.x * impulseB;
      bodyB.velocity.z += normal.z * impulseB;

      const separation = overlap * (massA / totalMass) * 0.5;
      bodyB.position.x += normal.x * separation;
      bodyB.position.z += normal.z * separation;
    }
  }

  resolveOverlap(bodyA: T, bodyB: T): void {
    const dx = bodyB.position.x - bodyA.position.x;
    const dz = bodyB.position.z - bodyA.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    const minDistance = bodyA.collisionRadius + bodyB.collisionRadius;

    if (distance < minDistance && distance > 0) {
      const overlap = minDistance - distance;
      const normalX = dx / distance;
      const normalZ = dz / distance;

      const massA = bodyA.mass || 1;
      const massB = bodyB.mass || 1;
      const totalMass = massA + massB;

      if (!bodyA.isStatic) {
        const separation = overlap * (massB / totalMass);
        bodyA.position.x -= normalX * separation;
        bodyA.position.z -= normalZ * separation;
      }

      if (!bodyB.isStatic) {
        const separation = overlap * (massA / totalMass);
        bodyB.position.x += normalX * separation;
        bodyB.position.z += normalZ * separation;
      }
    }
  }

  applyForce(body: T, force: { x: number; z: number }): void {
    if (body.isStatic) return;

    const mass = body.mass || 1;
    body.velocity.x += force.x / mass;
    body.velocity.z += force.z / mass;
  }

  applyImpulse(body: T, impulse: { x: number; z: number }): void {
    if (body.isStatic) return;

    const mass = body.mass || 1;
    body.velocity.x += impulse.x / mass;
    body.velocity.z += impulse.z / mass;
  }

  private applyDamping(): void {
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      body.velocity.x *= this.damping;
      body.velocity.z *= this.damping;

      if (Math.abs(body.velocity.x) < 0.001) body.velocity.x = 0;
      if (Math.abs(body.velocity.z) < 0.001) body.velocity.z = 0;
    }
  }

  private clampVelocity(): void {
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.z ** 2);
      if (speed > this.maxVelocity) {
        const scale = this.maxVelocity / speed;
        body.velocity.x *= scale;
        body.velocity.z *= scale;
      }
    }
  }

  private notifyCollisionListeners(event: ICollisionEvent<T>): void {
    for (const listener of this.collisionListeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in collision listener:', e);
      }
    }
  }

  getCollisionPairs(): Array<[T, T]> {
    const pairs: Array<[T, T]> = [];

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        if (this.checkCircleCollision(bodyA, bodyB)) {
          pairs.push([bodyA, bodyB]);
        }
      }
    }

    return pairs;
  }

  clear(): void {
    this.bodies = [];
    this.collisionListeners = [];
  }

  dispose(): void {
    this.clear();
  }
}

export function createPhysicsBody(
  id: string,
  x: number,
  z: number,
  collisionRadius: number = 1,
  mass: number = 1,
  isStatic: boolean = false
): IPhysicsBodyExtended {
  return {
    id,
    position: { x, z },
    velocity: { x: 0, z: 0 },
    collisionRadius,
    mass,
    isStatic
  };
}

export function distance2D(
  a: { x: number; z: number },
  b: { x: number; z: number }
): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function distanceSquared2D(
  a: { x: number; z: number },
  b: { x: number; z: number }
): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return dx * dx + dz * dz;
}

export function normalize2D(v: { x: number; z: number }): { x: number; z: number } {
  const length = Math.sqrt(v.x * v.x + v.z * v.z);
  if (length === 0) return { x: 0, z: 0 };
  return { x: v.x / length, z: v.z / length };
}
