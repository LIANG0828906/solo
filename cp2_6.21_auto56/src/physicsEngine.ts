export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const G = 1.0;

export function calcGravityAcceleration(
  asteroidPos: Vec3,
  starPos: Vec3,
  starMass: number
): Vec3 {
  const dx = starPos.x - asteroidPos.x;
  const dy = starPos.y - asteroidPos.y;
  const dz = starPos.z - asteroidPos.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  const dist = Math.sqrt(distSq);

  if (dist < 0.1) {
    return { x: 0, y: 0, z: 0 };
  }

  const a = (G * starMass) / distSq;
  return {
    x: (a * dx) / dist,
    y: (a * dy) / dist,
    z: (a * dz) / dist,
  };
}

export function integrateOrbitStep(
  position: Vec3,
  velocity: Vec3,
  acceleration: Vec3,
  dt: number
): { position: Vec3; velocity: Vec3 } {
  const newVelocity: Vec3 = {
    x: velocity.x + acceleration.x * dt,
    y: velocity.y + acceleration.y * dt,
    z: velocity.z + acceleration.z * dt,
  };
  const newPosition: Vec3 = {
    x: position.x + newVelocity.x * dt,
    y: position.y + newVelocity.y * dt,
    z: position.z + newVelocity.z * dt,
  };
  return { position: newPosition, velocity: newVelocity };
}

export function calcOrbitalEnergy(
  position: Vec3,
  velocity: Vec3,
  starMass: number
): { kinetic: number; potential: number; total: number } {
  const dx = position.x;
  const dy = position.y;
  const dz = position.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const speedSq =
    velocity.x * velocity.x +
    velocity.y * velocity.y +
    velocity.z * velocity.z;

  const kinetic = 0.5 * speedSq;
  const potential = dist > 0.01 ? -(G * starMass) / dist : -100000;
  const total = kinetic + potential;

  return { kinetic, potential, total };
}

export function calcOrbitalEccentricity(
  position: Vec3,
  velocity: Vec3,
  starMass: number
): number {
  const dx = position.x;
  const dy = position.y;
  const dz = position.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < 0.01) return 1;

  const speedSq =
    velocity.x * velocity.x +
    velocity.y * velocity.y +
    velocity.z * velocity.z;

  const dotProduct =
    position.x * velocity.x +
    position.y * velocity.y +
    position.z * velocity.z;

  const mu = G * starMass;

  const eX = ((speedSq - mu / dist) * dx - dotProduct * velocity.x) / mu;
  const eY = ((speedSq - mu / dist) * dy - dotProduct * velocity.y) / mu;
  const eZ = ((speedSq - mu / dist) * dz - dotProduct * velocity.z) / mu;

  const e = Math.sqrt(eX * eX + eY * eY + eZ * eZ);
  return Math.min(e, 1.5);
}

export function calcOrbitalPeriod(
  position: Vec3,
  velocity: Vec3,
  starMass: number
): number | null {
  const energy = calcOrbitalEnergy(position, velocity, starMass);
  if (energy.total >= 0) return null;

  const mu = G * starMass;
  const semiMajorAxis = -mu / (2 * energy.total);

  if (semiMajorAxis <= 0) return null;

  const period = 2 * Math.PI * Math.sqrt((semiMajorAxis * semiMajorAxis * semiMajorAxis) / mu);
  return period;
}
