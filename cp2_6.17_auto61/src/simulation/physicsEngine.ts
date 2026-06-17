import { Particle, SimulationParams } from '@/store/store';

export const TORUS_MAJOR_RADIUS = 1.5;
export const TORUS_MINOR_RADIUS = 0.4;
export const TOROIDAL_SPEED = 0.5;
export const RADIAL_PERTURBATION = 0.05;
export const COLLISION_DISTANCE = 0.06;

export interface ToroidalPosition {
  toroidalAngle: number;
  poloidalAngle: number;
  radialOffset: number;
}

export function toroidalToCartesian(
  pos: ToroidalPosition
): { x: number; y: number; z: number } {
  const { toroidalAngle, poloidalAngle, radialOffset } = pos;
  const r = TORUS_MAJOR_RADIUS + radialOffset * Math.cos(poloidalAngle);
  const x = r * Math.cos(toroidalAngle);
  const z = r * Math.sin(toroidalAngle);
  const y = radialOffset * Math.sin(poloidalAngle);
  return { x, y, z };
}

export function cartesianToToroidal(
  x: number,
  y: number,
  z: number
): ToroidalPosition {
  const r = Math.sqrt(x * x + z * z);
  const toroidalAngle = Math.atan2(z, x);
  const radialOffset = Math.sqrt(
    Math.pow(r - TORUS_MAJOR_RADIUS, 2) + y * y
  );
  const poloidalAngle = Math.atan2(y, r - TORUS_MAJOR_RADIUS);
  return { toroidalAngle, poloidalAngle, radialOffset };
}

export function calculateMagneticField(
  x: number,
  y: number,
  z: number,
  magneticStrength: number
): { x: number; y: number; z: number } {
  const r = Math.sqrt(x * x + z * z);
  if (r < 0.001) return { x: 0, y: 0, z: 0 };

  const toroidalFieldStrength = magneticStrength / r;

  const tx = -z / r;
  const tz = x / r;
  const ty = 0;

  const radialDirX = x / r;
  const radialDirZ = z / r;

  const poloidalAngle = Math.atan2(y, r - TORUS_MAJOR_RADIUS);
  const poloidalFieldStrength = magneticStrength * 0.3;
  const px = -Math.sin(poloidalAngle) * radialDirX;
  const pz = -Math.sin(poloidalAngle) * radialDirZ;
  const py = Math.cos(poloidalAngle);

  return {
    x: (tx * toroidalFieldStrength + px * poloidalFieldStrength) * 0.1,
    y: (ty * toroidalFieldStrength + py * poloidalFieldStrength) * 0.1,
    z: (tz * toroidalFieldStrength + pz * poloidalFieldStrength) * 0.1,
  };
}

export function updateParticleMotion(
  particle: Particle,
  params: SimulationParams,
  deltaTime: number
): Particle {
  const { magneticField } = params;
  const { toroidalAngle, poloidalAngle, radialOffset } = particle;

  const newToroidalAngle = toroidalAngle + TOROIDAL_SPEED * deltaTime;

  const newPoloidalAngle =
    poloidalAngle + TOROIDAL_SPEED * 0.5 * deltaTime * (magneticField / 5);

  const perturbation =
    (Math.random() - 0.5) * 2 * RADIAL_PERTURBATION * deltaTime;
  let newRadialOffset = Math.max(
    0,
    Math.min(TORUS_MINOR_RADIUS * 0.9, radialOffset + perturbation)
  );

  const cartesian = toroidalToCartesian({
    toroidalAngle: newToroidalAngle,
    poloidalAngle: newPoloidalAngle,
    radialOffset: newRadialOffset,
  });

  const bField = calculateMagneticField(
    cartesian.x,
    cartesian.y,
    cartesian.z,
    magneticField
  );

  const velocity = {
    x: bField.x * 0.5,
    y: bField.y * 0.5,
    z: bField.z * 0.5,
  };

  const tempVariation = (Math.random() - 0.5) * 0.01 * params.temperature;
  const newTemperature = Math.max(
    1e6,
    Math.min(1.5e8, particle.temperature + tempVariation)
  );

  return {
    ...particle,
    toroidalAngle: newToroidalAngle,
    poloidalAngle: newPoloidalAngle,
    radialOffset: newRadialOffset,
    position: cartesian,
    velocity,
    temperature: newTemperature,
  };
}

export function checkCollision(
  p1: Particle,
  p2: Particle
): { collided: boolean; distance: number } {
  const dx = p1.position.x - p2.position.x;
  const dy = p1.position.y - p2.position.y;
  const dz = p1.position.z - p2.position.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return { collided: distance < COLLISION_DISTANCE, distance };
}

export function getCollisionCenter(
  p1: Particle,
  p2: Particle
): { x: number; y: number; z: number } {
  return {
    x: (p1.position.x + p2.position.x) / 2,
    y: (p1.position.y + p2.position.y) / 2,
    z: (p1.position.z + p2.position.z) / 2,
  };
}
