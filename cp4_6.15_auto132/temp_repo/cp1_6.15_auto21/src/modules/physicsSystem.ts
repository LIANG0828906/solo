import {
  IPhysicsBody,
  PHYSICS_DAMPING,
  COLLISION_FORCE_MULTIPLIER,
  SPRING_STIFFNESS,
  MAX_PHYSICS_VELOCITY,
  COLLISION_PADDING
} from '../models/buildingConfig';

export interface ICollisionEvent {
  bodyA: IPhysicsBody;
  bodyB: IPhysicsBody;
  overlapX: number;
  overlapZ: number;
  normalX: number;
  normalZ: number;
}

export class PhysicsSystem {
  private bodies: IPhysicsBody[] = [];
  private damping: number;
  private forceMultiplier: number;
  private springStiffness: number;
  private maxVelocity: number;
  private collisionPadding: number;
  private collisionListeners: Array<(event: ICollisionEvent) => void> = [];

  constructor(
    damping: number = PHYSICS_DAMPING,
    forceMultiplier: number = COLLISION_FORCE_MULTIPLIER,
    springStiffness: number = SPRING_STIFFNESS,
    maxVelocity: number = MAX_PHYSICS_VELOCITY,
    collisionPadding: number = COLLISION_PADDING
  ) {
    this.damping = damping;
    this.forceMultiplier = forceMultiplier;
    this.springStiffness = springStiffness;
    this.maxVelocity = maxVelocity;
    this.collisionPadding = collisionPadding;
  }

  addBody(body: IPhysicsBody): void {
    this.bodies.push(body);
  }

  removeBody(body: IPhysicsBody): void {
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

  getBodies(): IPhysicsBody[] {
    return this.bodies;
  }

  getBodyById(id: string): IPhysicsBody | undefined {
    return this.bodies.find(b => b.id === id);
  }

  onCollision(listener: (event: ICollisionEvent) => void): () => void {
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

    const dt = Math.min(deltaTime, 0.05);

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
    const collisions: ICollisionEvent[] = [];

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        const collision = this.checkAABBCollision(bodyA, bodyB);
        if (collision) {
          collisions.push(collision);
          this.resolveCollision(collision);
        }
      }
    }

    for (const collision of collisions) {
      this.notifyCollisionListeners(collision);
    }
  }

  checkAABBCollision(bodyA: IPhysicsBody, bodyB: IPhysicsBody): ICollisionEvent | null {
    const padding = this.collisionPadding;
    
    const aMinX = bodyA.position.x - bodyA.halfWidth - padding;
    const aMaxX = bodyA.position.x + bodyA.halfWidth + padding;
    const aMinZ = bodyA.position.z - bodyA.halfDepth - padding;
    const aMaxZ = bodyA.position.z + bodyA.halfDepth + padding;

    const bMinX = bodyB.position.x - bodyB.halfWidth - padding;
    const bMaxX = bodyB.position.x + bodyB.halfWidth + padding;
    const bMinZ = bodyB.position.z - bodyB.halfDepth - padding;
    const bMaxZ = bodyB.position.z + bodyB.halfDepth + padding;

    if (aMaxX <= bMinX || aMinX >= bMaxX || aMaxZ <= bMinZ || aMinZ >= bMaxZ) {
      return null;
    }

    const overlapX = Math.min(aMaxX - bMinX, bMaxX - aMinX);
    const overlapZ = Math.min(aMaxZ - bMinZ, bMaxZ - aMinZ);

    let normalX: number;
    let normalZ: number;
    let overlap: number;

    if (overlapX < overlapZ) {
      overlap = overlapX;
      normalX = bodyA.position.x < bodyB.position.x ? -1 : 1;
      normalZ = 0;
    } else {
      overlap = overlapZ;
      normalX = 0;
      normalZ = bodyA.position.z < bodyB.position.z ? -1 : 1;
    }

    return {
      bodyA,
      bodyB,
      overlapX,
      overlapZ,
      normalX,
      normalZ
    };
  }

  private resolveCollision(collision: ICollisionEvent): void {
    const { bodyA, bodyB, normalX, normalZ } = collision;

    const dx = bodyB.position.x - bodyA.position.x;
    const dz = bodyB.position.z - bodyA.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.001) return;

    const overlap = Math.min(collision.overlapX, collision.overlapZ);

    const springForce = overlap * this.springStiffness * this.forceMultiplier;

    const nx = normalX !== 0 ? normalX : (dx / distance);
    const nz = normalZ !== 0 ? normalZ : (dz / distance);

    const relativeVelocityX = bodyB.velocity.x - bodyA.velocity.x;
    const relativeVelocityZ = bodyB.velocity.z - bodyA.velocity.z;
    const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityZ * nz;

    if (velocityAlongNormal > 0) return;

    const restitution = Math.min(bodyA.restitution, bodyB.restitution);
    const dampingForce = velocityAlongNormal * (1 + restitution);

    const totalForce = springForce - dampingForce;

    const massA = bodyA.mass || 1;
    const massB = bodyB.mass || 1;
    const totalMass = massA + massB;

    const impulseA = totalForce * (massB / totalMass);
    const impulseB = totalForce * (massA / totalMass);

    if (!bodyA.isStatic) {
      bodyA.velocity.x -= nx * impulseA;
      bodyA.velocity.z -= nz * impulseA;

      const separation = overlap * (massB / totalMass) * 0.5;
      bodyA.position.x -= nx * separation;
      bodyA.position.z -= nz * separation;
    }

    if (!bodyB.isStatic) {
      bodyB.velocity.x += nx * impulseB;
      bodyB.velocity.z += nz * impulseB;

      const separation = overlap * (massA / totalMass) * 0.5;
      bodyB.position.x += nx * separation;
      bodyB.position.z += nz * separation;
    }
  }

  applyForce(body: IPhysicsBody, force: { x: number; z: number }): void {
    if (body.isStatic) return;

    const mass = body.mass || 1;
    body.velocity.x += force.x / mass;
    body.velocity.z += force.z / mass;
  }

  applyImpulse(body: IPhysicsBody, impulse: { x: number; z: number }): void {
    if (body.isStatic) return;

    const mass = body.mass || 1;
    body.velocity.x += impulse.x / mass;
    body.velocity.z += impulse.z / mass;
  }

  applyRadialImpulse(centerX: number, centerZ: number, radius: number, force: number, excludeId?: string): void {
    for (const body of this.bodies) {
      if (body.isStatic || body.id === excludeId) continue;

      const dx = body.position.x - centerX;
      const dz = body.position.z - centerZ;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < radius && distance > 0) {
        const falloff = 1 - (distance / radius);
        const nx = dx / distance;
        const nz = dz / distance;

        this.applyImpulse(body, {
          x: nx * force * falloff,
          z: nz * force * falloff
        });
      }
    }
  }

  private applyDamping(): void {
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      body.velocity.x *= this.damping;
      body.velocity.z *= this.damping;

      if (Math.abs(body.velocity.x) < 0.005) body.velocity.x = 0;
      if (Math.abs(body.velocity.z) < 0.005) body.velocity.z = 0;
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

  private notifyCollisionListeners(event: ICollisionEvent): void {
    for (const listener of this.collisionListeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in collision listener:', e);
      }
    }
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
  halfWidth: number,
  halfDepth: number,
  mass: number = 1,
  isStatic: boolean = false,
  restitution: number = 0.2
): IPhysicsBody {
  return {
    id,
    position: { x, z },
    velocity: { x: 0, z: 0 },
    halfWidth,
    halfDepth,
    rotation: 0,
    mass,
    isStatic,
    restitution
  };
}
