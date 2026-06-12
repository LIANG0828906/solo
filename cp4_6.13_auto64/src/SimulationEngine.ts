import type { ParticleData, PresetType } from './store';

export const CONTAINER_SIZE = 8;
export const HALF_SIZE = CONTAINER_SIZE / 2;
export const TRAIL_LENGTH = 8;
export const BOUNCE_DAMPING = 0.8;

export interface EngineConfig {
  particleCount: number;
  vortexStrength: number;
  viscosity: number;
  initialVelocity: { x: number; y: number };
  activePreset: PresetType | null;
  presetTransitioning: boolean;
  removeList: Set<number>;
}

let particleIdCounter = 0;

export function createParticle(id?: number): ParticleData {
  const pid = id ?? particleIdCounter++;
  return {
    id: pid,
    position: new Float32Array(3),
    velocity: new Float32Array(3),
    trail: Array.from({ length: TRAIL_LENGTH }, () => new Float32Array(3)),
    alive: true,
  };
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function initRandomPos(p: ParticleData): void {
  p.position[0] = rand(-HALF_SIZE + 0.3, HALF_SIZE - 0.3);
  p.position[1] = rand(-HALF_SIZE + 0.3, HALF_SIZE - 0.3);
  p.position[2] = rand(-HALF_SIZE + 0.3, HALF_SIZE - 0.3);
}

function syncTrail(p: ParticleData): void {
  for (let i = 0; i < TRAIL_LENGTH; i++) {
    p.trail[i][0] = p.position[0];
    p.trail[i][1] = p.position[1];
    p.trail[i][2] = p.position[2];
  }
}

export function initPreset(particles: ParticleData[], preset: PresetType, cfg: EngineConfig): void {
  for (const p of particles) {
    initRandomPos(p);
    const { x: ivx, y: ivy } = cfg.initialVelocity;

    switch (preset) {
      case 'laminar': {
        const base = 1.8 + Math.random() * 0.6;
        p.velocity[0] = ivx !== 0 ? ivx * base : base;
        p.velocity[1] = ivy * 0.4 + (Math.random() - 0.5) * 0.15;
        p.velocity[2] = (Math.random() - 0.5) * 0.3;
        break;
      }
      case 'vortex': {
        const px = p.position[0];
        const py = p.position[1];
        const r = Math.sqrt(px * px + py * py) + 0.1;
        const tangentX = -py / r;
        const tangentY = px / r;
        const speed = 1.2 + cfg.vortexStrength * 0.25;
        p.velocity[0] = tangentX * speed + ivx * 0.3;
        p.velocity[1] = tangentY * speed + ivy * 0.3;
        p.velocity[2] = (Math.random() - 0.5) * 0.8;
        break;
      }
      case 'turbulent': {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = (1.5 + Math.random() * 3.5) * (1 + cfg.vortexStrength * 0.08);
        p.velocity[0] = Math.sin(phi) * Math.cos(theta) * speed + ivx;
        p.velocity[1] = Math.sin(phi) * Math.sin(theta) * speed + ivy;
        p.velocity[2] = Math.cos(phi) * speed + (Math.random() - 0.5) * 2;
        break;
      }
    }
    syncTrail(p);
  }
}

export function resizeParticles(
  particles: ParticleData[],
  target: number,
  cfg: EngineConfig,
): ParticleData[] {
  if (particles.length === target) return particles;
  if (particles.length < target) {
    const add: ParticleData[] = [];
    for (let i = particles.length; i < target; i++) {
      const np = createParticle();
      initRandomPos(np);
      const { x: ivx, y: ivy } = cfg.initialVelocity;
      const speed = 1.0 + Math.random() * 2.0;
      np.velocity[0] = ivx * speed + (Math.random() - 0.5);
      np.velocity[1] = ivy * speed + (Math.random() - 0.5);
      np.velocity[2] = (Math.random() - 0.5) * 2;
      syncTrail(np);
      add.push(np);
    }
    return [...particles, ...add];
  }
  return particles.slice(0, target);
}

export function startPresetTransition(
  particles: ParticleData[],
  preset: PresetType,
  cfg: EngineConfig,
): { targetPos: Float32Array[]; targetVel: Float32Array[] } {
  const snapshot = particles.map((p) => ({
    id: p.id,
    pos: new Float32Array(p.position),
    vel: new Float32Array(p.velocity),
  }));

  initPreset(particles, preset, cfg);

  const targetPos: Float32Array[] = [];
  const targetVel: Float32Array[] = [];
  for (let i = 0; i < particles.length; i++) {
    targetPos.push(new Float32Array(particles[i].position));
    targetVel.push(new Float32Array(particles[i].velocity));
    particles[i].position.set(snapshot[i].pos);
    particles[i].velocity.set(snapshot[i].vel);
  }
  return { targetPos, targetVel };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function applyTransition(
  particles: ParticleData[],
  targetPos: Float32Array[],
  targetVel: Float32Array[],
  progress: number,
): void {
  const t = progress;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const tp = targetPos[i];
    const tv = targetVel[i];
    if (!tp || !tv) continue;
    p.position[0] = lerp(p.position[0], tp[0], t);
    p.position[1] = lerp(p.position[1], tp[1], t);
    p.position[2] = lerp(p.position[2], tp[2], t);
    p.velocity[0] = lerp(p.velocity[0], tv[0], t);
    p.velocity[1] = lerp(p.velocity[1], tv[1], t);
    p.velocity[2] = lerp(p.velocity[2], tv[2], t);
  }
}

export function stepSimulation(
  particles: ParticleData[],
  dt: number,
  cfg: EngineConfig,
): void {
  const clampedDt = Math.min(dt, 1 / 30);
  const vortexScale = cfg.vortexStrength;
  const visc = cfg.viscosity;
  const damping = 1 - visc * clampedDt * 0.5;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.alive) continue;

    if (vortexScale > 0.01) {
      const x = p.position[0];
      const z = p.position[2];
      const r2 = x * x + z * z + 0.05;
      const invR = 1 / Math.sqrt(r2);
      const tx = -z * invR;
      const tz = x * invR;
      const f = vortexScale * 0.35 * clampedDt * Math.min(2, 3 / (r2 * 0.3 + 1));
      p.velocity[0] += tx * f;
      p.velocity[2] += tz * f;
    }

    p.velocity[0] *= damping;
    p.velocity[1] *= damping;
    p.velocity[2] *= damping;

    p.position[0] += p.velocity[0] * clampedDt;
    p.position[1] += p.velocity[1] * clampedDt;
    p.position[2] += p.velocity[2] * clampedDt;

    for (let axis = 0; axis < 3; axis++) {
      if (p.position[axis] > HALF_SIZE) {
        p.position[axis] = HALF_SIZE;
        p.velocity[axis] = -Math.abs(p.velocity[axis]) * BOUNCE_DAMPING;
      } else if (p.position[axis] < -HALF_SIZE) {
        p.position[axis] = -HALF_SIZE;
        p.velocity[axis] = Math.abs(p.velocity[axis]) * BOUNCE_DAMPING;
      }
    }

    if (cfg.removeList.has(p.id)) {
      p.alive = false;
      continue;
    }

    for (let t = TRAIL_LENGTH - 1; t > 0; t--) {
      p.trail[t][0] = p.trail[t - 1][0];
      p.trail[t][1] = p.trail[t - 1][1];
      p.trail[t][2] = p.trail[t - 1][2];
    }
    p.trail[0][0] = p.position[0];
    p.trail[0][1] = p.position[1];
    p.trail[0][2] = p.position[2];
  }
}

export function getSpeed(v: Float32Array): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

export function speedToColor(speed: number, out: Float32Array, preset: PresetType | null): void {
  const t = Math.min(1, speed / 6);

  if (preset === 'vortex') {
    const r1 = 0.4, g1 = 0.2, b1 = 0.8;
    const r2 = 0.0, g2 = 0.4, b2 = 0.8;
    out[0] = r1 + (r2 - r1) * t;
    out[1] = g1 + (g2 - g1) * t;
    out[2] = b1 + (b2 - b1) * t;
    return;
  }

  if (t < 0.5) {
    const k = t * 2;
    out[0] = 0.0 + k * 0.0;
    out[1] = 0.4 + k * (0.9 - 0.4);
    out[2] = 0.8 + k * (0.79 - 0.8);
  } else {
    const k = (t - 0.5) * 2;
    out[0] = 0.0 + k * (1.0 - 0.0);
    out[1] = 0.9 + k * (0.42 - 0.9);
    out[2] = 0.79 + k * (0.21 - 0.79);
  }
}
