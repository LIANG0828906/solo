import * as THREE from 'three';
import { Particle } from '../types';

const MAX_PARTICLES = 500;

export const updateParticles = (
  particles: Particle[],
  deltaTime: number
): { particles: Particle[]; toRemove: string[] } => {
  const toRemove: string[] = [];
  const updated = particles.map((particle) => {
    const dt = deltaTime * 1000;
    const newLife = particle.life - deltaTime;
    if (newLife <= 0) {
      toRemove.push(particle.id);
      return particle;
    }

    const newPosition = particle.position
      .clone()
      .add(particle.velocity.clone().multiplyScalar(deltaTime));

    return {
      ...particle,
      position: newPosition,
      life: newLife,
    };
  });

  return {
    particles: updated,
    toRemove,
  };
};

export const getParticleOpacity = (particle: Particle): number => {
  return Math.max(0, particle.life / particle.maxLife);
};

export const createParticleBurst = (
  position: THREE.Vector3,
  color: string,
  count: number
): Particle[] => {
  const now = performance.now();
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const direction = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    particles.push({
      id: `particle-${now}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      position: position.clone(),
      velocity: direction.multiplyScalar(0.2),
      color,
      size: 0.01,
      life: 1.5,
      maxLife: 1.5,
      createdAt: now,
    });
  }
  return particles;
};

export const manageParticlePool = (particles: Particle[]): Particle[] => {
  if (particles.length <= MAX_PARTICLES) {
    return particles;
  }
  return particles.slice(particles.length - MAX_PARTICLES);
};
