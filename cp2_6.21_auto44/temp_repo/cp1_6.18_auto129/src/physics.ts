import type { Particle, ForceParams, SimulationStats, ParticleType } from './types';

const MAX_SPEED = 2;
const HEALTH_DECAY_PER_SECOND = 1;
const MAX_PARTICLES = 500;

const PARTICLE_BASE_SIZE: Record<ParticleType, number> = {
  producer: 8,
  consumer: 12,
  hunter: 16,
};

export function createParticle(
  x: number,
  y: number,
  type: ParticleType,
  size?: number,
  health?: number
): Particle {
  const baseSize = size ?? PARTICLE_BASE_SIZE[type];
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    type,
    size: baseSize,
    radius: baseSize / 2,
    health: health ?? 100,
    trail: [],
  };
}

export function updateParticles(
  particles: Particle[],
  mouseX: number,
  mouseY: number,
  forceParams: ForceParams,
  deltaTime: number,
  stats: SimulationStats
): Particle[] {
  const { gravityStrength, repulsionRadius, turbulenceAmplitude } = forceParams;

  const decayAmount = HEALTH_DECAY_PER_SECOND * deltaTime;

  for (const p of particles) {
    const dx = mouseX - p.x;
    const dy = mouseY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      const gravityForce = gravityStrength * 0.01;
      p.vx += (dx / dist) * gravityForce;
      p.vy += (dy / dist) * gravityForce;
    }

    p.vx += (Math.random() * 2 - 1) * turbulenceAmplitude * 0.1;
    p.vy += (Math.random() * 2 - 1) * turbulenceAmplitude * 0.1;
  }

  for (let i = 0; i < particles.length; i++) {
    const p1 = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0 && dist < repulsionRadius) {
        const forceMagnitude = (1 - dist / repulsionRadius) * 1.5;
        const sizeFactor = (p1.radius + p2.radius) / 12;
        const fx = (dx / dist) * forceMagnitude * sizeFactor;
        const fy = (dy / dist) * forceMagnitude * sizeFactor;
        p1.vx -= fx;
        p1.vy -= fy;
        p2.vx += fx;
        p2.vy += fy;
      }
    }
  }

  for (const p of particles) {
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }
  }

  for (const p of particles) {
    p.trail.unshift({ x: p.x, y: p.y });
    if (p.trail.length > 2) {
      p.trail.pop();
    }
  }

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
  }

  const toRemove = new Set<number>();
  const toAdd: Particle[] = [];
  const DEFLECT_ANGLE = 25 * Math.PI / 180;

  for (let i = 0; i < particles.length; i++) {
    if (toRemove.has(i)) continue;
    const p1 = particles[i];

    for (let j = i + 1; j < particles.length; j++) {
      if (toRemove.has(j)) continue;
      const p2 = particles[j];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = p1.radius + p2.radius;

      if (dist < minDist) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        if (p1.type === p2.type) {
          const mergedSize = Math.sqrt(p1.size * p1.size + p2.size * p2.size);
          const mergedHealth = p1.health + p2.health;
          const totalSize = p1.size + p2.size;
          p1.vx = (p1.vx * p1.size + p2.vx * p2.size) / totalSize;
          p1.vy = (p1.vy * p1.size + p2.vy * p2.size) / totalSize;
          p1.x = (p1.x * p1.size + p2.x * p2.size) / totalSize;
          p1.y = (p1.y * p1.size + p2.y * p2.size) / totalSize;
          p1.size = mergedSize;
          p1.radius = mergedSize / 2;
          p1.health = mergedHealth;
          toRemove.add(j);
        } else if (p1.type === 'hunter' && p2.type === 'consumer') {
          p1.health += 20;
          toRemove.add(j);
          stats.eatsThisSecond++;
        } else if (p2.type === 'hunter' && p1.type === 'consumer') {
          p2.health += 20;
          toRemove.add(i);
          stats.eatsThisSecond++;
          break;
        } else if (p1.type === 'consumer' && p2.type === 'producer') {
          toRemove.add(j);

          if (particles.length - toRemove.size + toAdd.length < MAX_PARTICLES) {
            const childSize = p1.size * 0.7;
            const baseAngle = Math.atan2(p1.vy, p1.vx);
            const angle1 = baseAngle - DEFLECT_ANGLE + (Math.random() - 0.5) * 0.2;
            const angle2 = baseAngle + DEFLECT_ANGLE + (Math.random() - 0.5) * 0.2;
            const childHealth = p1.health * 0.5;

            const child1 = createParticle(
              p1.x + Math.cos(angle1) * p1.radius,
              p1.y + Math.sin(angle1) * p1.radius,
              'consumer',
              childSize,
              childHealth
            );
            child1.vx = Math.cos(angle1) * 1.5;
            child1.vy = Math.sin(angle1) * 1.5;

            const child2 = createParticle(
              p1.x + Math.cos(angle2) * p1.radius,
              p1.y + Math.sin(angle2) * p1.radius,
              'consumer',
              childSize,
              childHealth
            );
            child2.vx = Math.cos(angle2) * 1.5;
            child2.vy = Math.sin(angle2) * 1.5;

            toAdd.push(child1, child2);
            toRemove.add(i);
            stats.splitsThisSecond++;
            break;
          }
        } else if (p2.type === 'consumer' && p1.type === 'producer') {
          toRemove.add(i);

          if (particles.length - toRemove.size + toAdd.length < MAX_PARTICLES) {
            const childSize = p2.size * 0.7;
            const baseAngle = Math.atan2(p2.vy, p2.vx);
            const angle1 = baseAngle - DEFLECT_ANGLE + (Math.random() - 0.5) * 0.2;
            const angle2 = baseAngle + DEFLECT_ANGLE + (Math.random() - 0.5) * 0.2;
            const childHealth = p2.health * 0.5;

            const child1 = createParticle(
              p2.x + Math.cos(angle1) * p2.radius,
              p2.y + Math.sin(angle1) * p2.radius,
              'consumer',
              childSize,
              childHealth
            );
            child1.vx = Math.cos(angle1) * 1.5;
            child1.vy = Math.sin(angle1) * 1.5;

            const child2 = createParticle(
              p2.x + Math.cos(angle2) * p2.radius,
              p2.y + Math.sin(angle2) * p2.radius,
              'consumer',
              childSize,
              childHealth
            );
            child2.vx = Math.cos(angle2) * 1.5;
            child2.vy = Math.sin(angle2) * 1.5;

            toAdd.push(child1, child2);
            toRemove.add(j);
            stats.splitsThisSecond++;
          }
        }
      }
    }
  }

  const newParticles: Particle[] = [];
  for (let i = 0; i < particles.length; i++) {
    if (!toRemove.has(i)) {
      newParticles.push(particles[i]);
    }
  }

  for (const p of newParticles) {
    p.health -= decayAmount;
  }

  const result = newParticles.filter((p) => p.health > 0 && p.size > 2);

  for (const p of toAdd) {
    if (result.length < MAX_PARTICLES) {
      result.push(p);
    }
  }

  return result;
}

export function wrapParticles(particles: Particle[], width: number, height: number): void {
  for (const p of particles) {
    if (p.x < -p.radius) p.x = width + p.radius;
    if (p.x > width + p.radius) p.x = -p.radius;
    if (p.y < -p.radius) p.y = height + p.radius;
    if (p.y > height + p.radius) p.y = -p.radius;
  }
}
