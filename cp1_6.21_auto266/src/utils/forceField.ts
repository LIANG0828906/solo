import { GravityField, VortexField, WindField, Vec3 } from '../types';

export function applyGravity(
  velocity: Vec3,
  gravity: GravityField,
  dt: number
): void {
  const acc = gravity.strength * dt;
  switch (gravity.axis) {
    case 'x':
      velocity.x += acc;
      break;
    case 'y':
      velocity.y += acc;
      break;
    case 'z':
      velocity.z += acc;
      break;
  }
}

export function applyVortex(
  position: Vec3,
  velocity: Vec3,
  vortex: VortexField,
  dt: number
): void {
  if (vortex.strength === 0) return;

  const dx = position.x - vortex.position.x;
  const dy = position.y - vortex.position.y;
  const dz = position.z - vortex.position.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  const radiusSq = vortex.radius * vortex.radius;

  if (distSq > radiusSq) return;

  const dist = Math.sqrt(distSq) + 0.001;
  const falloff = 1 - distSq / radiusSq;
  const forceMag = vortex.strength * falloff * dt * 0.1;

  const upX = 0;
  const upY = 1;
  const upZ = 0;

  const tangentX = dy * upZ - dz * upY;
  const tangentY = dz * upX - dx * upZ;
  const tangentZ = dx * upY - dy * upX;

  const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ) + 0.001;
  velocity.x += (tangentX / tangentLen) * forceMag;
  velocity.y += (tangentY / tangentLen) * forceMag;
  velocity.z += (tangentZ / tangentLen) * forceMag;

  const inwardForce = forceMag * 0.3;
  velocity.x -= (dx / dist) * inwardForce;
  velocity.z -= (dz / dist) * inwardForce;
}

export function applyWind(
  velocity: Vec3,
  wind: WindField,
  dt: number
): void {
  if (wind.strength === 0) return;
  const angleRad = (wind.angle * Math.PI) / 180;
  const force = wind.strength * dt * 0.2;
  velocity.x += Math.cos(angleRad) * force;
  velocity.z += Math.sin(angleRad) * force;
}

export function applyAllForces(
  position: Vec3,
  velocity: Vec3,
  gravity: GravityField,
  vortex: VortexField,
  wind: WindField,
  dt: number
): void {
  applyGravity(velocity, gravity, dt);
  applyVortex(position, velocity, vortex, dt);
  applyWind(velocity, wind, dt);
}
