import { Particle, TrailPoint, CollisionEvent, SimParams } from './types';

const NEBULA_PALETTE: [number, number, number][] = [
  [1.0, 0.42, 0.42],
  [1.0, 0.851, 0.239],
  [0.42, 0.796, 0.467],
  [0.302, 0.588, 1.0],
  [0.608, 0.349, 0.722],
];

const TRAIL_LENGTH = 5;
const INTERACTION_DISTANCE = 3.0;
const SPATIAL_CELL_SIZE = 3.0;

export class ParticleEngine {
  particles: Particle[];
  params: SimParams;
  targetParams: SimParams;
  private paramLerpSpeed: number;
  collisionEvents: CollisionEvent[];

  constructor(count: number, sphereRadius: number) {
    this.particles = [];
    this.params = { gravity: 0.8, speedMultiplier: 1.0, elasticity: 0.3 };
    this.targetParams = { gravity: 0.8, speedMultiplier: 1.0, elasticity: 0.3 };
    this.paramLerpSpeed = 1.0 / 0.5;
    this.collisionEvents = [];
    this.initParticles(count, sphereRadius);
  }

  private initParticles(count: number, radius: number): void {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const speed = 0.02 + Math.random() * 0.08;
      const vTheta = Math.random() * Math.PI * 2;
      const vPhi = Math.acos(2 * Math.random() - 1);
      const vx = speed * Math.sin(vPhi) * Math.cos(vTheta);
      const vy = speed * Math.sin(vPhi) * Math.sin(vTheta);
      const vz = speed * Math.cos(vPhi);

      const palette = NEBULA_PALETTE[Math.floor(Math.random() * NEBULA_PALETTE.length)];
      const size = 2 + Math.random() * 4;

      this.particles.push({
        id: i,
        x, y, z,
        vx, vy, vz,
        r: palette[0],
        g: palette[1],
        b: palette[2],
        size,
        trail: [],
      });
    }
  }

  setTargetParams(target: Partial<SimParams>): void {
    if (target.gravity !== undefined) this.targetParams.gravity = target.gravity;
    if (target.speedMultiplier !== undefined) this.targetParams.speedMultiplier = target.speedMultiplier;
    if (target.elasticity !== undefined) this.targetParams.elasticity = target.elasticity;
  }

  update(dt: number): CollisionEvent[] {
    this.lerpParams(dt);
    const events: CollisionEvent[] = [];
    const { gravity, speedMultiplier, elasticity } = this.params;

    for (const p of this.particles) {
      p.trail.push({ x: p.x, y: p.y, z: p.z });
      if (p.trail.length > TRAIL_LENGTH) {
        p.trail.shift();
      }
    }

    const cellMap = new Map<string, number[]>();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const cx = Math.floor(p.x / SPATIAL_CELL_SIZE);
      const cy = Math.floor(p.y / SPATIAL_CELL_SIZE);
      const cz = Math.floor(p.z / SPATIAL_CELL_SIZE);
      const key = `${cx},${cy},${cz}`;
      let cell = cellMap.get(key);
      if (!cell) {
        cell = [];
        cellMap.set(key, cell);
      }
      cell.push(i);
    }

    const processed = new Set<string>();
    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      const cx = Math.floor(a.x / SPATIAL_CELL_SIZE);
      const cy = Math.floor(a.y / SPATIAL_CELL_SIZE);
      const cz = Math.floor(a.z / SPATIAL_CELL_SIZE);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const key = `${cx + dx},${cy + dy},${cz + dz}`;
            const cell = cellMap.get(key);
            if (!cell) continue;

            for (const j of cell) {
              if (j <= i) continue;
              const pairKey = i < j ? `${i}_${j}` : `${j}_${i}`;
              if (processed.has(pairKey)) continue;
              processed.add(pairKey);

              const b = this.particles[j];
              const ddx = b.x - a.x;
              const ddy = b.y - a.y;
              const ddz = b.z - a.z;
              const distSq = ddx * ddx + ddy * ddy + ddz * ddz;

              if (distSq < INTERACTION_DISTANCE * INTERACTION_DISTANCE && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                const nx = ddx / dist;
                const ny = ddy / dist;
                const nz = ddz / dist;

                const forceMag = gravity / distSq;
                const fx = forceMag * nx;
                const fy = forceMag * ny;
                const fz = forceMag * nz;

                a.vx += fx * dt;
                a.vy += fy * dt;
                a.vz += fz * dt;
                b.vx -= fx * dt;
                b.vy -= fy * dt;
                b.vz -= fz * dt;

                if (dist < 0.8) {
                  const relVx = a.vx - b.vx;
                  const relVy = a.vy - b.vy;
                  const relVz = a.vz - b.vz;
                  const relVn = relVx * nx + relVy * ny + relVz * nz;

                  if (relVn > 0) {
                    const impulse = (1 + elasticity) * relVn * 0.5;
                    a.vx -= impulse * nx;
                    a.vy -= impulse * ny;
                    a.vz -= impulse * nz;
                    b.vx += impulse * nx;
                    b.vy += impulse * ny;
                    b.vz += impulse * nz;

                    const avgR = (a.r + b.r) * 0.5;
                    const avgG = (a.g + b.g) * 0.5;
                    const avgB = (a.b + b.b) * 0.5;
                    a.r = avgR;
                    a.g = avgG;
                    a.b = avgB;
                    b.r = avgR;
                    b.g = avgG;
                    b.b = avgB;

                    events.push({
                      timestamp: performance.now(),
                      idA: a.id,
                      idB: b.id,
                      colorA: { r: avgR, g: avgG, b: avgB },
                      colorB: { r: avgR, g: avgG, b: avgB },
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    for (const p of this.particles) {
      p.x += p.vx * speedMultiplier * dt * 60;
      p.y += p.vy * speedMultiplier * dt * 60;
      p.z += p.vz * speedMultiplier * dt * 60;
    }

    this.collisionEvents = events;
    return events;
  }

  private lerpParams(dt: number): void {
    const t = Math.min(1, this.paramLerpSpeed * dt);
    this.params.gravity += (this.targetParams.gravity - this.params.gravity) * t;
    this.params.speedMultiplier += (this.targetParams.speedMultiplier - this.params.speedMultiplier) * t;
    this.params.elasticity += (this.targetParams.elasticity - this.params.elasticity) * t;
  }
}
