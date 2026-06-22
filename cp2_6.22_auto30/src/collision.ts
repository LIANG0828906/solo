import * as THREE from 'three';
import { GalaxyData } from './galaxy';

export interface SimParams {
  mass1: number;
  mass2: number;
  distance: number;
  angle: number;
  velocityMultiplier: number;
}

export interface EnergyStats {
  kinetic: number;
  potential: number;
  total: number;
}

const G = 1.5;
const SOFTENING = 2.0;

export function computeEnergy(
  galaxy1: GalaxyData,
  galaxy2: GalaxyData
): EnergyStats {
  let kinetic = 0;
  let potential = 0;

  const count1 = galaxy1.masses.length;
  const count2 = galaxy2.masses.length;

  for (let i = 0; i < count1; i++) {
    const i3 = i * 3;
    const vx = galaxy1.velocities[i3];
    const vy = galaxy1.velocities[i3 + 1];
    const vz = galaxy1.velocities[i3 + 2];
    kinetic += 0.5 * galaxy1.masses[i] * (vx * vx + vy * vy + vz * vz);
  }

  for (let i = 0; i < count2; i++) {
    const i3 = i * 3;
    const vx = galaxy2.velocities[i3];
    const vy = galaxy2.velocities[i3 + 1];
    const vz = galaxy2.velocities[i3 + 2];
    kinetic += 0.5 * galaxy2.masses[i] * (vx * vx + vy * vy + vz * vz);
  }

  const interDist = galaxy1.corePosition.distanceTo(galaxy2.corePosition);
  const interDistSoftened = Math.sqrt(interDist * interDist + SOFTENING * SOFTENING);
  potential -= G * galaxy1.mass * galaxy2.mass / interDistSoftened;

  for (let i = 0; i < count1; i++) {
    const i3 = i * 3;
    const rx = galaxy1.positions[i3];
    const ry = galaxy1.positions[i3 + 1];
    const rz = galaxy1.positions[i3 + 2];
    const rSq = rx * rx + ry * ry + rz * rz;
    const r = Math.sqrt(rSq + SOFTENING * SOFTENING);
    const innerMassRatio = Math.min(1, Math.sqrt(rSq) / 40);
    const effectiveMass = galaxy1.mass * innerMassRatio * innerMassRatio;
    potential -= G * effectiveMass * galaxy1.masses[i] / r;
  }

  for (let i = 0; i < count2; i++) {
    const i3 = i * 3;
    const rx = galaxy2.positions[i3];
    const ry = galaxy2.positions[i3 + 1];
    const rz = galaxy2.positions[i3 + 2];
    const rSq = rx * rx + ry * ry + rz * rz;
    const r = Math.sqrt(rSq + SOFTENING * SOFTENING);
    const innerMassRatio = Math.min(1, Math.sqrt(rSq) / 40);
    const effectiveMass = galaxy2.mass * innerMassRatio * innerMassRatio;
    potential -= G * effectiveMass * galaxy2.masses[i] / r;
  }

  return {
    kinetic,
    potential,
    total: kinetic + potential
  };
}

export function updateGalaxyPhysics(
  galaxy1: GalaxyData,
  galaxy2: GalaxyData,
  deltaTime: number
): void {
  const count1 = galaxy1.masses.length;
  const count2 = galaxy2.masses.length;

  const coreForce1 = new THREE.Vector3();
  const coreForce2 = new THREE.Vector3();

  const dx = galaxy2.corePosition.x - galaxy1.corePosition.x;
  const dy = galaxy2.corePosition.y - galaxy1.corePosition.y;
  const dz = galaxy2.corePosition.z - galaxy1.corePosition.z;

  const distSq = dx * dx + dy * dy + dz * dz + SOFTENING * SOFTENING;
  const dist = Math.sqrt(distSq);
  const distCubed = dist * distSq;

  const forceMag = G * galaxy1.mass * galaxy2.mass;
  coreForce1.set(
    forceMag * dx / distCubed,
    forceMag * dy / distCubed,
    forceMag * dz / distCubed
  );
  coreForce2.copy(coreForce1).negate();

  galaxy1.coreVelocity.addScaledVector(coreForce1, deltaTime / galaxy1.mass);
  galaxy2.coreVelocity.addScaledVector(coreForce2, deltaTime / galaxy2.mass);

  galaxy1.corePosition.addScaledVector(galaxy1.coreVelocity, deltaTime);
  galaxy2.corePosition.addScaledVector(galaxy2.coreVelocity, deltaTime);

  updateParticleForces(galaxy1, galaxy2, deltaTime, galaxy2.corePosition, galaxy2.mass);
  updateParticleForces(galaxy2, galaxy1, deltaTime, galaxy1.corePosition, galaxy1.mass);

  galaxy1.points.position.copy(galaxy1.corePosition);
  galaxy2.points.position.copy(galaxy2.corePosition);
  galaxy1.heatmapMesh.position.copy(galaxy1.corePosition);
  galaxy2.heatmapMesh.position.copy(galaxy2.corePosition);
}

function updateParticleForces(
  targetGalaxy: GalaxyData,
  otherGalaxy: GalaxyData,
  deltaTime: number,
  otherCore: THREE.Vector3,
  otherMass: number
): void {
  const count = targetGalaxy.masses.length;
  const positions = targetGalaxy.positions;
  const velocities = targetGalaxy.velocities;
  const masses = targetGalaxy.masses;

  const coreX = targetGalaxy.corePosition.x;
  const coreY = targetGalaxy.corePosition.y;
  const coreZ = targetGalaxy.corePosition.z;

  const coreMass = targetGalaxy.mass;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const px = positions[i3] + coreX;
    const py = positions[i3 + 1] + coreY;
    const pz = positions[i3 + 2] + coreZ;

    const rdx = -positions[i3];
    const rdy = -positions[i3 + 1];
    const rdz = -positions[i3 + 2];
    const rDistSq = rdx * rdx + rdy * rdy + rdz * rdz + SOFTENING * SOFTENING;
    const rDist = Math.sqrt(rDistSq);
    const rDistCubed = rDist * rDistSq;

    const innerMassRatio = Math.min(1, rDist / 40);
    const effectiveCoreMass = coreMass * innerMassRatio * innerMassRatio;
    const coreForceMag = G * effectiveCoreMass;

    const odx = otherCore.x - px;
    const ody = otherCore.y - py;
    const odz = otherCore.z - pz;
    const oDistSq = odx * odx + ody * ody + odz * odz + SOFTENING * SOFTENING;
    const oDist = Math.sqrt(oDistSq);
    const oDistCubed = oDist * oDistSq;
    const otherForceMag = G * otherMass;

    const ax = (coreForceMag * rdx / rDistCubed) + (otherForceMag * odx / oDistCubed);
    const ay = (coreForceMag * rdy / rDistCubed) + (otherForceMag * ody / oDistCubed);
    const az = (coreForceMag * rdz / rDistCubed) + (otherForceMag * odz / oDistCubed);

    velocities[i3] += ax * deltaTime;
    velocities[i3 + 1] += ay * deltaTime;
    velocities[i3 + 2] += az * deltaTime;

    const damping = 0.999;
    velocities[i3] *= damping;
    velocities[i3 + 1] *= damping;
    velocities[i3 + 2] *= damping;

    positions[i3] += velocities[i3] * deltaTime;
    positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
    positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
  }

  const geometry = targetGalaxy.points.geometry;
  geometry.attributes.position.needsUpdate = true;
}

export function getInitialPositions(
  params: SimParams
): {
  pos1: THREE.Vector3;
  vel1: THREE.Vector3;
  pos2: THREE.Vector3;
  vel2: THREE.Vector3;
} {
  const { distance, angle, mass1, mass2, velocityMultiplier } = params;

  const totalMass = mass1 + mass2;
  const d1 = distance * mass2 / totalMass;
  const d2 = distance * mass1 / totalMass;

  const angleRad = (angle * Math.PI) / 180;

  const pos1 = new THREE.Vector3(-d1 * Math.cos(angleRad / 2), 0, -d1 * Math.sin(angleRad / 2));
  const pos2 = new THREE.Vector3(d2 * Math.cos(angleRad / 2), 0, d2 * Math.sin(angleRad / 2));

  const vMag = Math.sqrt(G * totalMass / distance) * 0.5 * velocityMultiplier;

  const velDir = new THREE.Vector3(
    Math.sin(angleRad / 2),
    0,
    -Math.cos(angleRad / 2)
  ).normalize();

  const vel1 = velDir.clone().multiplyScalar(vMag);
  const vel2 = velDir.clone().multiplyScalar(-vMag * (mass1 / mass2));

  return { pos1, vel1, pos2, vel2 };
}
