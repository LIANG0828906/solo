import * as THREE from 'three';

export type ZoneType = 'residential' | 'commercial' | 'office' | 'other';

export interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number;
  homeZone: ZoneType;
  currentZone: ZoneType;
  targetZone: ZoneType;
  trail: THREE.Vector3[];
  phase: number;
  wanderAngle: number;
}

export interface ParticleSystemData {
  particles: Particle[];
  positions: Float32Array;
  colors: Float32Array;
  trailPositions: Float32Array;
  trailColors: Float32Array;
}

const PARTICLE_COUNT = 800;
const TRAIL_LENGTH = 25;
const FLOOR_HEIGHT = 3;

interface ZoneBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const ZONE_BOUNDS: Record<ZoneType, ZoneBounds[]> = {
  residential: [
    { minX: -45, maxX: -25, minZ: -35, maxZ: -10 },
    { minX: -45, maxX: -25, minZ: 10, maxZ: 35 },
    { minX: 25, maxX: 45, minZ: -35, maxZ: -10 },
    { minX: 25, maxX: 45, minZ: 10, maxZ: 35 },
  ],
  office: [
    { minX: -18, maxX: 18, minZ: -20, maxZ: 20 },
  ],
  commercial: [
    { minX: -30, maxX: -18, minZ: -5, maxZ: 5 },
    { minX: 18, maxX: 30, minZ: -5, maxZ: 5 },
    { minX: -8, maxX: 8, minZ: -25, maxZ: -20 },
    { minX: -8, maxX: 8, minZ: 20, maxZ: 25 },
  ],
  other: [
    { minX: -35, maxX: 35, minZ: -45, maxZ: -35 },
    { minX: -35, maxX: 35, minZ: 35, maxZ: 45 },
  ],
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getRandomPositionInZone(zone: ZoneType): THREE.Vector3 {
  const boundsList = ZONE_BOUNDS[zone];
  const bounds = boundsList[Math.floor(Math.random() * boundsList.length)];
  const x = randomInRange(bounds.minX, bounds.maxX);
  const z = randomInRange(bounds.minZ, bounds.maxZ);
  return new THREE.Vector3(x, 1.5 + Math.random() * 0.5, z);
}

function getZoneCenter(zone: ZoneType): THREE.Vector3 {
  const boundsList = ZONE_BOUNDS[zone];
  const bounds = boundsList[0];
  return new THREE.Vector3(
    (bounds.minX + bounds.maxX) / 2,
    2,
    (bounds.minZ + bounds.maxZ) / 2
  );
}

function lerpColor(
  color1: THREE.Color,
  color2: THREE.Color,
  t: number
): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, t);
}

function getSpeedColor(speed: number, maxSpeed: number): THREE.Color {
  const normalizedSpeed = Math.min(speed / maxSpeed, 1);
  const warmYellow = new THREE.Color(0xffd27f);
  const brightWhite = new THREE.Color(0xffffff);
  const lightBlue = new THREE.Color(0x4ac7ff);

  if (normalizedSpeed < 0.5) {
    const t = normalizedSpeed * 2;
    return lerpColor(warmYellow, brightWhite, t);
  } else {
    const t = (normalizedSpeed - 0.5) * 2;
    return lerpColor(brightWhite, lightBlue, t);
  }
}

export function createParticles(count: number = PARTICLE_COUNT): Particle[] {
  const particles: Particle[] = [];
  const zoneDistribution: ZoneType[] = [
    'residential', 'residential', 'residential', 'residential',
    'office', 'office', 'office',
    'commercial', 'commercial',
    'other',
  ];

  for (let i = 0; i < count; i++) {
    const homeZone = zoneDistribution[Math.floor(Math.random() * zoneDistribution.length)];
    const position = getRandomPositionInZone(homeZone);
    const trail: THREE.Vector3[] = [];
    for (let j = 0; j < TRAIL_LENGTH; j++) {
      trail.push(position.clone());
    }

    particles.push({
      id: i,
      position,
      velocity: new THREE.Vector3(0, 0, 0),
      speed: 0,
      homeZone,
      currentZone: homeZone,
      targetZone: homeZone,
      trail,
      phase: Math.random() * Math.PI * 2,
      wanderAngle: Math.random() * Math.PI * 2,
    });
  }

  return particles;
}

function getTargetZone(hour: number, particle: Particle): ZoneType {
  if (hour >= 6 && hour < 9) {
    return particle.homeZone === 'residential' ? 'office' : particle.homeZone;
  } else if (hour >= 9 && hour < 12) {
    return 'office';
  } else if (hour >= 12 && hour < 14) {
    return Math.random() > 0.3 ? 'commercial' : 'office';
  } else if (hour >= 14 && hour < 17) {
    return 'office';
  } else if (hour >= 17 && hour < 20) {
    return particle.homeZone === 'residential' ? 'residential' : 'other';
  } else {
    return particle.homeZone;
  }
}

function getMaxSpeed(hour: number): number {
  if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20)) {
    return 3.5;
  } else if ((hour >= 12 && hour < 14)) {
    return 2.5;
  } else if (hour >= 9 && hour < 17) {
    return 0.8;
  } else {
    return 0.3;
  }
}

export function updateParticles(
  particles: Particle[],
  hour: number,
  deltaTime: number
): void {
  const maxSpeed = getMaxSpeed(hour);
  const dt = Math.min(deltaTime, 0.1);

  for (const particle of particles) {
    const targetZone = getTargetZone(hour, particle);

    if (targetZone !== particle.targetZone) {
      particle.targetZone = targetZone;
    }

    const targetPos = getRandomPositionInZone(particle.targetZone);
    const toTarget = new THREE.Vector3().subVectors(targetPos, particle.position);
    const dist = toTarget.length();

    if (dist > 0.5) {
      toTarget.normalize();

      particle.wanderAngle += (Math.random() - 0.5) * 0.5 * dt;
      const wanderOffset = new THREE.Vector3(
        Math.cos(particle.wanderAngle) * 0.3,
        0,
        Math.sin(particle.wanderAngle) * 0.3
      );

      const desiredVel = toTarget.multiplyScalar(maxSpeed).add(wanderOffset);
      const accel = new THREE.Vector3().subVectors(desiredVel, particle.velocity);
      accel.multiplyScalar(dt * 2.5);
      particle.velocity.add(accel);

      const currentSpeed = particle.velocity.length();
      if (currentSpeed > maxSpeed) {
        particle.velocity.normalize().multiplyScalar(maxSpeed);
      }
    } else {
      particle.velocity.multiplyScalar(0.95);
      if (Math.random() < 0.01) {
        particle.wanderAngle = Math.random() * Math.PI * 2;
      }
    }

    particle.position.add(particle.velocity.clone().multiplyScalar(dt));
    particle.speed = particle.velocity.length();

    particle.position.x = Math.max(-48, Math.min(48, particle.position.x));
    particle.position.z = Math.max(-48, Math.min(48, particle.position.z));

    particle.trail.pop();
    particle.trail.unshift(particle.position.clone());

    let closestZone: ZoneType = 'other';
    let closestDist = Infinity;
    for (const zone of Object.keys(ZONE_BOUNDS) as ZoneType[]) {
      const center = getZoneCenter(zone);
      const d = particle.position.distanceTo(center);
      if (d < closestDist) {
        closestDist = d;
        closestZone = zone;
      }
    }
    particle.currentZone = closestZone;
  }
}

const TRAIL_SEGMENTS = TRAIL_LENGTH - 1;

export function getParticleData(particles: Particle[]): ParticleSystemData {
  const positions = new Float32Array(particles.length * 3);
  const colors = new Float32Array(particles.length * 3);
  const trailPositions = new Float32Array(particles.length * TRAIL_SEGMENTS * 2 * 3);
  const trailColors = new Float32Array(particles.length * TRAIL_SEGMENTS * 2 * 3);

  const maxSpeed = 4;

  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];

    positions[i * 3] = particle.position.x;
    positions[i * 3 + 1] = particle.position.y;
    positions[i * 3 + 2] = particle.position.z;

    const color = getSpeedColor(particle.speed, maxSpeed);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    for (let j = 0; j < TRAIL_SEGMENTS; j++) {
      const baseIdx = i * TRAIL_SEGMENTS * 6 + j * 6;

      const point1 = particle.trail[j];
      const point2 = particle.trail[j + 1];

      trailPositions[baseIdx] = point1.x;
      trailPositions[baseIdx + 1] = point1.y;
      trailPositions[baseIdx + 2] = point1.z;
      trailPositions[baseIdx + 3] = point2.x;
      trailPositions[baseIdx + 4] = point2.y;
      trailPositions[baseIdx + 5] = point2.z;

      const alpha = 1 - j / TRAIL_LENGTH;
      const trailColor = getSpeedColor(particle.speed * alpha, maxSpeed);
      trailColors[baseIdx] = trailColor.r * alpha;
      trailColors[baseIdx + 1] = trailColor.g * alpha;
      trailColors[baseIdx + 2] = trailColor.b * alpha;
      trailColors[baseIdx + 3] = trailColor.r * alpha * 0.8;
      trailColors[baseIdx + 4] = trailColor.g * alpha * 0.8;
      trailColors[baseIdx + 5] = trailColor.b * alpha * 0.8;
    }
  }

  return { particles, positions, colors, trailPositions, trailColors };
}

export { TRAIL_SEGMENTS };

export function getPopulationDistribution(
  particles: Particle[]
): Record<ZoneType, number> {
  const counts: Record<ZoneType, number> = {
    residential: 0,
    commercial: 0,
    office: 0,
    other: 0,
  };

  for (const particle of particles) {
    counts[particle.currentZone]++;
  }

  const total = particles.length;
  return {
    residential: counts.residential / total,
    commercial: counts.commercial / total,
    office: counts.office / total,
    other: counts.other / total,
  };
}

export { PARTICLE_COUNT, TRAIL_LENGTH, FLOOR_HEIGHT };
