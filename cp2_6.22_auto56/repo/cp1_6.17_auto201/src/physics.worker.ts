import {
  Particle,
  ForceField,
  FusionEvent,
  generateInitialParticles,
  updateParticles,
} from './particle';

let particles: Particle[] = [];
let forceField: ForceField | null = null;
let gravityScale = 1;
let nextParticleId = 1000;

interface WorkerConfig {
  particleCount: number;
  sphereRadius: number;
}

let config: WorkerConfig = {
  particleCount: 1000,
  sphereRadius: 3,
};

self.onmessage = function (e: MessageEvent) {
  const data = e.data;

  switch (data.type) {
    case 'init':
      config = data.config || config;
      particles = generateInitialParticles(config.particleCount, config.sphereRadius);
      nextParticleId = config.particleCount;
      postMessage({ type: 'update', particles, fusions: [] });
      break;

    case 'update':
      const dt = data.dt || 0.016;
      const result = updateParticles(particles, dt, forceField, gravityScale);
      particles = result.particles;
      postMessage({ type: 'update', particles, fusions: result.fusions });
      break;

    case 'forceField':
      forceField = data.forceField;
      break;

    case 'addParticle':
      const newParticle: Particle = {
        id: nextParticleId++,
        x: data.x,
        y: data.y,
        z: data.z,
        vx: data.vx || 0,
        vy: data.vy || 0,
        vz: data.vz || 0,
        mass: 1,
        color: data.color,
      };
      particles.push(newParticle);
      break;

    case 'setGravityScale':
      gravityScale = data.scale;
      break;
  }
};

export {};
