import type { IStellarBody } from '@/utils/types';

interface CollisionParticle {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
  color: string;
}

export class PhysicsEngine {
  private bodies: Map<string, IStellarBody> = new Map();
  private G: number = 1.0;
  private trajectoryLength: number = 200;
  private collisionParticles: CollisionParticle[] = [];

  constructor() {}

  public initSystem(bodies: IStellarBody[]): void {
    this.bodies.clear();
    bodies.forEach((body) => {
      this.bodies.set(body.id, { ...body, trajectory: [...body.trajectory] });
    });
  }

  public setG(G: number): void {
    this.G = G;
  }

  public setTrajectoryLength(length: number): void {
    this.trajectoryLength = Math.max(50, Math.min(500, length));
  }

  public getBodies(): IStellarBody[] {
    return Array.from(this.bodies.values()).map((b) => ({
      ...b,
      trajectory: [...b.trajectory],
    }));
  }

  public getBody(id: string): IStellarBody | undefined {
    const body = this.bodies.get(id);
    if (!body) return undefined;
    return { ...body, trajectory: [...body.trajectory] };
  }

  public addBody(body: IStellarBody): void {
    this.bodies.set(body.id, { ...body, trajectory: [...body.trajectory] });
  }

  public removeBody(id: string): void {
    this.bodies.delete(id);
  }

  public step(dt: number): {
    bodies: IStellarBody[];
    collisionEvents: Array<{ mergedId: string; position: { x: number; y: number; z: number } }>;
    particles: CollisionParticle[];
  } {
    const bodyArray = Array.from(this.bodies.values());
    const collisionEvents: Array<{ mergedId: string; position: { x: number; y: number; z: number } }> = [];

    const k1v: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const k1p: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const k2v: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const k2p: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const k3v: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const k3p: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const k4v: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const k4p: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);

    const tempPositions: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);
    const tempVelocities: Array<{ x: number; y: number; z: number }> = new Array(bodyArray.length);

    for (let i = 0; i < bodyArray.length; i++) {
      k1v[i] = this.computeAcceleration(i, bodyArray);
      k1p[i] = { x: bodyArray[i].velocity.x, y: bodyArray[i].velocity.y, z: bodyArray[i].velocity.z };
    }

    for (let i = 0; i < bodyArray.length; i++) {
      tempPositions[i] = {
        x: bodyArray[i].position.x + k1p[i].x * dt * 0.5,
        y: bodyArray[i].position.y + k1p[i].y * dt * 0.5,
        z: bodyArray[i].position.z + k1p[i].z * dt * 0.5,
      };
      tempVelocities[i] = {
        x: bodyArray[i].velocity.x + k1v[i].x * dt * 0.5,
        y: bodyArray[i].velocity.y + k1v[i].y * dt * 0.5,
        z: bodyArray[i].velocity.z + k1v[i].z * dt * 0.5,
      };
    }
    for (let i = 0; i < bodyArray.length; i++) {
      k2v[i] = this.computeAccelerationWithTemp(i, bodyArray, tempPositions);
      k2p[i] = { x: tempVelocities[i].x, y: tempVelocities[i].y, z: tempVelocities[i].z };
    }

    for (let i = 0; i < bodyArray.length; i++) {
      tempPositions[i] = {
        x: bodyArray[i].position.x + k2p[i].x * dt * 0.5,
        y: bodyArray[i].position.y + k2p[i].y * dt * 0.5,
        z: bodyArray[i].position.z + k2p[i].z * dt * 0.5,
      };
      tempVelocities[i] = {
        x: bodyArray[i].velocity.x + k2v[i].x * dt * 0.5,
        y: bodyArray[i].velocity.y + k2v[i].y * dt * 0.5,
        z: bodyArray[i].velocity.z + k2v[i].z * dt * 0.5,
      };
    }
    for (let i = 0; i < bodyArray.length; i++) {
      k3v[i] = this.computeAccelerationWithTemp(i, bodyArray, tempPositions);
      k3p[i] = { x: tempVelocities[i].x, y: tempVelocities[i].y, z: tempVelocities[i].z };
    }

    for (let i = 0; i < bodyArray.length; i++) {
      tempPositions[i] = {
        x: bodyArray[i].position.x + k3p[i].x * dt,
        y: bodyArray[i].position.y + k3p[i].y * dt,
        z: bodyArray[i].position.z + k3p[i].z * dt,
      };
      tempVelocities[i] = {
        x: bodyArray[i].velocity.x + k3v[i].x * dt,
        y: bodyArray[i].velocity.y + k3v[i].y * dt,
        z: bodyArray[i].velocity.z + k3v[i].z * dt,
      };
    }
    for (let i = 0; i < bodyArray.length; i++) {
      k4v[i] = this.computeAccelerationWithTemp(i, bodyArray, tempPositions);
      k4p[i] = { x: tempVelocities[i].x, y: tempVelocities[i].y, z: tempVelocities[i].z };
    }

    const merged = new Set<number>();
    for (let i = 0; i < bodyArray.length; i++) {
      if (merged.has(i)) continue;

      bodyArray[i].position.x += (dt / 6) * (k1p[i].x + 2 * k2p[i].x + 2 * k3p[i].x + k4p[i].x);
      bodyArray[i].position.y += (dt / 6) * (k1p[i].y + 2 * k2p[i].y + 2 * k3p[i].y + k4p[i].y);
      bodyArray[i].position.z += (dt / 6) * (k1p[i].z + 2 * k2p[i].z + 2 * k3p[i].z + k4p[i].z);

      bodyArray[i].velocity.x += (dt / 6) * (k1v[i].x + 2 * k2v[i].x + 2 * k3v[i].x + k4v[i].x);
      bodyArray[i].velocity.y += (dt / 6) * (k1v[i].y + 2 * k2v[i].y + 2 * k3v[i].y + k4v[i].y);
      bodyArray[i].velocity.z += (dt / 6) * (k1v[i].z + 2 * k2v[i].z + 2 * k3v[i].z + k4v[i].z);

      bodyArray[i].trajectory.push({
        x: bodyArray[i].position.x,
        y: bodyArray[i].position.y,
        z: bodyArray[i].position.z,
      });
      if (bodyArray[i].trajectory.length > this.trajectoryLength) {
        bodyArray[i].trajectory.shift();
      }
    }

    for (let i = 0; i < bodyArray.length; i++) {
      if (merged.has(i)) continue;
      for (let j = i + 1; j < bodyArray.length; j++) {
        if (merged.has(j)) continue;

        const dx = bodyArray[j].position.x - bodyArray[i].position.x;
        const dy = bodyArray[j].position.y - bodyArray[i].position.y;
        const dz = bodyArray[j].position.z - bodyArray[i].position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDist = bodyArray[i].radius + bodyArray[j].radius;

        if (dist < minDist && dist > 0) {
          const mergedBody = this.mergeBodies(bodyArray[i], bodyArray[j]);
          collisionEvents.push({
            mergedId: mergedBody.id,
            position: { ...mergedBody.position },
          });
          this.createCollisionParticles(mergedBody.position, mergedBody.color);

          bodyArray[i] = mergedBody;
          merged.add(j);
          this.bodies.delete(bodyArray[j].id);
          break;
        }
      }
    }

    this.bodies.clear();
    for (let i = 0; i < bodyArray.length; i++) {
      if (!merged.has(i)) {
        this.bodies.set(bodyArray[i].id, bodyArray[i]);
      }
    }

    this.updateParticles(dt);

    return {
      bodies: this.getBodies(),
      collisionEvents,
      particles: [...this.collisionParticles],
    };
  }

  private computeAcceleration(index: number, bodies: IStellarBody[]): { x: number; y: number; z: number } {
    let ax = 0,
      ay = 0,
      az = 0;
    const body = bodies[index];

    for (let i = 0; i < bodies.length; i++) {
      if (i === index) continue;

      const other = bodies[i];
      const dx = other.position.x - body.position.x;
      const dy = other.position.y - body.position.y;
      const dz = other.position.z - body.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < 0.1) continue;

      const force = (this.G * other.mass) / (distSq * dist);
      ax += force * dx;
      ay += force * dy;
      az += force * dz;
    }

    return { x: ax, y: ay, z: az };
  }

  private computeAccelerationWithTemp(
    index: number,
    bodies: IStellarBody[],
    tempPositions: Array<{ x: number; y: number; z: number }>
  ): { x: number; y: number; z: number } {
    let ax = 0,
      ay = 0,
      az = 0;
    const pos = tempPositions[index];

    for (let i = 0; i < bodies.length; i++) {
      if (i === index) continue;

      const otherPos = tempPositions[i];
      const otherMass = bodies[i].mass;

      const dx = otherPos.x - pos.x;
      const dy = otherPos.y - pos.y;
      const dz = otherPos.z - pos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < 0.1) continue;

      const force = (this.G * otherMass) / (distSq * dist);
      ax += force * dx;
      ay += force * dy;
      az += force * dz;
    }

    return { x: ax, y: ay, z: az };
  }

  private mergeBodies(a: IStellarBody, b: IStellarBody): IStellarBody {
    const totalMass = a.mass + b.mass;
    const newVelocity = {
      x: (a.mass * a.velocity.x + b.mass * b.velocity.x) / totalMass,
      y: (a.mass * a.velocity.y + b.mass * b.velocity.y) / totalMass,
      z: (a.mass * a.velocity.z + b.mass * b.velocity.z) / totalMass,
    };
    const newPosition = {
      x: (a.mass * a.position.x + b.mass * b.position.x) / totalMass,
      y: (a.mass * a.position.y + b.mass * b.position.y) / totalMass,
      z: (a.mass * a.position.z + b.mass * b.position.z) / totalMass,
    };

    const newRadius = Math.cbrt(Math.pow(a.radius, 3) + Math.pow(b.radius, 3));
    const newColor = this.getColorByMass(totalMass);

    return {
      id: a.id,
      name: `${a.name} + ${b.name}`,
      mass: totalMass,
      position: newPosition,
      velocity: newVelocity,
      color: newColor,
      radius: newRadius,
      trajectory: [...a.trajectory.slice(-this.trajectoryLength / 2)],
    };
  }

  public getColorByMass(mass: number): string {
    if (mass <= 10) return '#4488ff';
    if (mass <= 100) return '#ffaa44';
    return '#ff4444';
  }

  private createCollisionParticles(position: { x: number; y: number; z: number }, color: string): void {
    for (let i = 0; i < 100; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2 + Math.random() * 5;
      this.collisionParticles.push({
        position: { ...position },
        velocity: {
          x: Math.sin(phi) * Math.cos(theta) * speed,
          y: Math.sin(phi) * Math.sin(theta) * speed,
          z: Math.cos(phi) * speed,
        },
        life: 0.5,
        maxLife: 0.5,
        color,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.collisionParticles.length - 1; i >= 0; i--) {
      const p = this.collisionParticles[i];
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += p.velocity.z * dt;
      p.life -= dt;

      if (p.life <= 0) {
        this.collisionParticles.splice(i, 1);
      }
    }
  }

  public getParticles(): CollisionParticle[] {
    return [...this.collisionParticles];
  }

  public calculateKineticEnergy(body: IStellarBody): number {
    const v = body.velocity;
    const speedSq = v.x * v.x + v.y * v.y + v.z * v.z;
    return 0.5 * body.mass * speedSq;
  }

  public calculatePotentialEnergy(body: IStellarBody, allBodies: IStellarBody[]): number {
    let potential = 0;
    for (const other of allBodies) {
      if (other.id === body.id) continue;
      const dx = other.position.x - body.position.x;
      const dy = other.position.y - body.position.y;
      const dz = other.position.z - body.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0) {
        potential -= (this.G * body.mass * other.mass) / dist;
      }
    }
    return potential;
  }

  public saveState(): { bodies: IStellarBody[]; timestamp: number } {
    return {
      bodies: this.getBodies(),
      timestamp: Date.now(),
    };
  }

  public loadState(state: { bodies: IStellarBody[] }): void {
    this.initSystem(state.bodies);
  }
}
