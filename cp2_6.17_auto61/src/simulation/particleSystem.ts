import { v4 as uuidv4 } from 'uuid';
import {
  Particle,
  SimulationParams,
  tempToColor,
} from '@/store/store';
import {
  TORUS_MINOR_RADIUS,
  toroidalToCartesian,
  updateParticleMotion,
  checkCollision,
  getCollisionCenter,
} from './physicsEngine';

export function generateParticle(params: SimulationParams): Particle {
  const toroidalAngle = Math.random() * Math.PI * 2;
  const poloidalAngle = Math.random() * Math.PI * 2;
  const radialOffset = Math.random() * TORUS_MINOR_RADIUS * 0.8;
  const size = 3 + Math.random() * 5;
  const tempBase = params.temperature;
  const temperature = tempBase * (0.7 + Math.random() * 0.6);
  const color = tempToColor(temperature, 1e6, 1.5e8);
  const position = toroidalToCartesian({
    toroidalAngle,
    poloidalAngle,
    radialOffset,
  });

  return {
    id: uuidv4(),
    position,
    velocity: { x: 0, y: 0, z: 0 },
    temperature,
    size,
    color,
    toroidalAngle,
    poloidalAngle,
    radialOffset,
  };
}

export function generateInitialParticles(
  params: SimulationParams
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < params.particleCount; i++) {
    particles.push(generateParticle(params));
  }
  return particles;
}

export function updateParticleCount(
  existingParticles: Particle[],
  newCount: number,
  params: SimulationParams
): Particle[] {
  const currentCount = existingParticles.length;
  if (currentCount === newCount) return existingParticles;

  if (currentCount < newCount) {
    const newParticles = [...existingParticles];
    const toAdd = newCount - currentCount;
    for (let i = 0; i < toAdd; i++) {
      newParticles.push(generateParticle(params));
    }
    return newParticles;
  } else {
    return existingParticles.slice(0, newCount);
  }
}

export interface SimulationStepResult {
  particles: Particle[];
  collisions: Array<{ x: number; y: number; z: number }>;
  averageTemperature: number;
}

export function simulationStep(
  particles: Particle[],
  params: SimulationParams,
  deltaTime: number,
  lastCollisionCheck: Map<string, number>
): SimulationStepResult {
  const now = Date.now();
  const updatedParticles = particles.map((p) => {
    const updated = updateParticleMotion(p, params, deltaTime);
    return {
      ...updated,
      color: tempToColor(updated.temperature, 1e6, 1.5e8),
    };
  });

  const collisions: Array<{ x: number; y: number; z: number }> = [];
  const collisionThreshold = 6;

  for (let i = 0; i < updatedParticles.length; i++) {
    for (let j = i + 1; j < updatedParticles.length; j++) {
      const p1 = updatedParticles[i];
      const p2 = updatedParticles[j];

      const key = `${p1.id}-${p2.id}`;
      const lastCheck = lastCollisionCheck.get(key) || 0;
      if (now - lastCheck < 500) continue;

      const { collided } = checkCollision(p1, p2);
      if (collided) {
        lastCollisionCheck.set(key, now);
        const probabilityCheck = Math.random() * 100 < params.reactionProbability;
        if (probabilityCheck) {
          const center = getCollisionCenter(p1, p2);
          collisions.push(center);
        }
      }
    }
  }

  const totalTemp = updatedParticles.reduce(
    (sum, p) => sum + p.temperature,
    0
  );
  const averageTemperature = totalTemp / updatedParticles.length;

  return {
    particles: updatedParticles,
    collisions,
    averageTemperature,
  };
}

export function calculateReactionRate(
  collisions: number,
  timeWindow: number
): number {
  return timeWindow > 0 ? collisions / (timeWindow / 1000) : 0;
}
