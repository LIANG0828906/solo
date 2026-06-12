import type { Particle, Vector3, FieldConfig, TrailData } from './types';
import { TRAIL_LENGTH } from './store';

const PHYSICS_DT = 0.01667;
const MAX_SPEED = 15;
const DAMPING = 0.998;
const VORTEX_SCALE = 0.3;
const BOUNDARY = 30;

function clampVector(v: Vector3, max: number): Vector3 {
  const len2 = v.x * v.x + v.y * v.y + v.z * v.z;
  if (len2 > max * max) {
    const len = Math.sqrt(len2);
    const s = max / len;
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  }
  return v;
}

function computeForce(
  pos: Vector3,
  fieldConfig: FieldConfig
): Vector3 {
  let fx = 0;
  let fy = 0;
  let fz = 0;

  const vs = fieldConfig.vortexStrength * VORTEX_SCALE;
  if (Math.abs(vs) > 0.0001) {
    const vfx = -pos.z * vs - pos.y * vs * 0.3;
    const vfy = pos.x * vs * 0.3;
    const vfz = pos.x * vs - pos.y * vs * 0.1;
    fx += vfx;
    fy += vfy;
    fz += vfz;
  }

  for (const a of fieldConfig.attractors) {
    const dx = a.position.x - pos.x;
    const dy = a.position.y - pos.y;
    const dz = a.position.z - pos.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    const d = Math.sqrt(d2) + 0.1;
    const invD3 = 1 / (d2 * d);
    const f = a.strength * 20;
    fx += dx * invD3 * f;
    fy += dy * invD3 * f;
    fz += dz * invD3 * f;
  }

  for (const r of fieldConfig.repulsors) {
    const dx = pos.x - r.position.x;
    const dy = pos.y - r.position.y;
    const dz = pos.z - r.position.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < r.radius && d > 0.001) {
      const t = 1 - d / r.radius;
      const f = t * t * 30;
      fx += (dx / d) * f;
      fy += (dy / d) * f;
      fz += (dz / d) * f;
    }
  }

  return { x: fx, y: fy, z: fz };
}

function enforceBoundary(p: Particle): void {
  if (p.position.x > BOUNDARY) {
    p.position.x = BOUNDARY;
    p.velocity.x = -Math.abs(p.velocity.x) * 0.5;
  } else if (p.position.x < -BOUNDARY) {
    p.position.x = -BOUNDARY;
    p.velocity.x = Math.abs(p.velocity.x) * 0.5;
  }
  if (p.position.y > BOUNDARY) {
    p.position.y = BOUNDARY;
    p.velocity.y = -Math.abs(p.velocity.y) * 0.5;
  } else if (p.position.y < -BOUNDARY) {
    p.position.y = -BOUNDARY;
    p.velocity.y = Math.abs(p.velocity.y) * 0.5;
  }
  if (p.position.z > BOUNDARY) {
    p.position.z = BOUNDARY;
    p.velocity.z = -Math.abs(p.velocity.z) * 0.5;
  } else if (p.position.z < -BOUNDARY) {
    p.position.z = -BOUNDARY;
    p.velocity.z = Math.abs(p.velocity.z) * 0.5;
  }
}

export function updateParticles(
  particles: Particle[],
  trails: TrailData[],
  fieldConfig: FieldConfig,
  steps: number = 1
): { particles: Particle[]; trails: TrailData[] } {
  const n = particles.length;
  const newParticles: Particle[] = new Array(n);
  const newTrails: TrailData[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const p = { ...particles[i] };
    p.position = { ...p.position };
    p.velocity = { ...p.velocity };

    for (let s = 0; s < steps; s++) {
      const force = computeForce(p.position, fieldConfig);

      p.velocity.x += force.x * PHYSICS_DT;
      p.velocity.y += force.y * PHYSICS_DT;
      p.velocity.z += force.z * PHYSICS_DT;

      p.velocity.x *= DAMPING;
      p.velocity.y *= DAMPING;
      p.velocity.z *= DAMPING;

      const clamped = clampVector(p.velocity, MAX_SPEED);
      p.velocity = clamped;

      p.position.x += p.velocity.x * PHYSICS_DT;
      p.position.y += p.velocity.y * PHYSICS_DT;
      p.position.z += p.velocity.z * PHYSICS_DT;

      enforceBoundary(p);
    }

    newParticles[i] = p;

    const trail = trails[i];
    let newPositions: Vector3[];
    if (trail.positions.length >= TRAIL_LENGTH) {
      newPositions = trail.positions.slice(1);
    } else {
      newPositions = trail.positions.slice();
    }
    newPositions.push({ ...p.position });
    newTrails[i] = {
      particleId: p.id,
      positions: newPositions,
      color: trail.color,
    };
  }

  return { particles: newParticles, trails: newTrails };
}
