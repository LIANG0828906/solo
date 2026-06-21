import { CelestialBody } from './CelestialBody';

const G = 50;

export class PhysicsEngine {
  private bodies: CelestialBody[];

  constructor(bodies: CelestialBody[] = []) {
    this.bodies = bodies;
  }

  public setBodies(bodies: CelestialBody[]): void {
    this.bodies = bodies;
  }

  public update(deltaTime: number): void {
    const accelerations = this.bodies.map(() => ({ x: 0, y: 0, z: 0 }));

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        const dx = bodyB.position.x - bodyA.position.x;
        const dy = bodyB.position.y - bodyA.position.y;
        const dz = bodyB.position.z - bodyA.position.z;

        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq);

        if (dist < 0.1) continue;

        const force = (G * bodyA.mass * bodyB.mass) / distSq;

        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;
        const fz = (force * dz) / dist;

        accelerations[i].x += fx / bodyA.mass;
        accelerations[i].y += fy / bodyA.mass;
        accelerations[i].z += fz / bodyA.mass;

        accelerations[j].x -= fx / bodyB.mass;
        accelerations[j].y -= fy / bodyB.mass;
        accelerations[j].z -= fz / bodyB.mass;
      }
    }

    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      const acc = accelerations[i];

      body.velocity.x += acc.x * deltaTime;
      body.velocity.y += acc.y * deltaTime;
      body.velocity.z += acc.z * deltaTime;

      body.position.x += body.velocity.x * deltaTime;
      body.position.y += body.velocity.y * deltaTime;
      body.position.z += body.velocity.z * deltaTime;
    }
  }

  public calculateOrbitalPeriod(planet: CelestialBody, star: CelestialBody): number | null {
    if (star.type !== 'star') return null;

    const distance = planet.getDistanceTo(star);
    const speed = planet.getSpeed();

    if (speed < 0.001 || distance < 0.001) return null;

    const semiMajorAxis = distance;
    const totalMass = star.mass + planet.mass;

    if (totalMass <= 0) return null;

    const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (G * totalMass));

    return period;
  }
}
