export interface ParticleState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  trail: Array<{ x: number; y: number; z: number }>;
  trailHead: number;
  isProbe: boolean;
  probeId?: number;
  probeColor?: string;
}

export interface LorenzParams {
  sigma: number;
  rho: number;
  beta: number;
}

export const DEFAULT_LORENZ_PARAMS: LorenzParams = {
  sigma: 10,
  rho: 28,
  beta: 8 / 3,
};

export const TRAIL_LENGTH = 20;
export const PARTICLE_COUNT = 800;
export const TIME_STEP = 0.005;
export const SUB_STEPS_PER_FRAME = 3;

function lorenzDerivatives(
  x: number,
  y: number,
  z: number,
  sigma: number,
  rho: number,
  beta: number
): { dx: number; dy: number; dz: number } {
  return {
    dx: sigma * (y - x),
    dy: x * (rho - z) - y,
    dz: x * y - beta * z,
  };
}

export function stepRK4(
  state: ParticleState,
  dt: number,
  params: LorenzParams
): ParticleState {
  const { sigma, rho, beta } = params;
  const { x, y, z } = state;

  const k1 = lorenzDerivatives(x, y, z, sigma, rho, beta);
  const k2 = lorenzDerivatives(
    x + k1.dx * dt * 0.5,
    y + k1.dy * dt * 0.5,
    z + k1.dz * dt * 0.5,
    sigma,
    rho,
    beta
  );
  const k3 = lorenzDerivatives(
    x + k2.dx * dt * 0.5,
    y + k2.dy * dt * 0.5,
    z + k2.dz * dt * 0.5,
    sigma,
    rho,
    beta
  );
  const k4 = lorenzDerivatives(
    x + k3.dx * dt,
    y + k3.dy * dt,
    z + k3.dz * dt,
    sigma,
    rho,
    beta
  );

  const newX = x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
  const newY = y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
  const newZ = z + (dt / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz);

  const vx = (newX - x) / dt;
  const vy = (newY - y) / dt;
  const vz = (newZ - z) / dt;

  state.trail[state.trailHead] = { x: newX, y: newY, z: newZ };
  state.trailHead = (state.trailHead + 1) % TRAIL_LENGTH;

  state.x = newX;
  state.y = newY;
  state.z = newZ;
  state.vx = vx;
  state.vy = vy;
  state.vz = vz;

  return state;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function createInitialParticles(
  count: number = PARTICLE_COUNT,
  existingProbes: Array<{
    initialX: number;
    initialY: number;
    initialZ: number;
    id: number;
    color: string;
  }> = []
): ParticleState[] {
  const particles: ParticleState[] = [];

  const remainingCount = count - existingProbes.length;
  for (let i = 0; i < remainingCount; i++) {
    const seed = i * 997.3;
    const initialX = (seededRandom(seed) - 0.5) * 20;
    const initialY = (seededRandom(seed + 1) - 0.5) * 20;
    const initialZ = seededRandom(seed + 2) * 30;

    const trail: Array<{ x: number; y: number; z: number }> = [];
    for (let t = 0; t < TRAIL_LENGTH; t++) {
      trail.push({ x: initialX, y: initialY, z: initialZ });
    }

    particles.push({
      x: initialX,
      y: initialY,
      z: initialZ,
      vx: 0,
      vy: 0,
      vz: 0,
      trail,
      trailHead: 0,
      isProbe: false,
    });
  }

  for (const probe of existingProbes) {
    const trail: Array<{ x: number; y: number; z: number }> = [];
    for (let t = 0; t < TRAIL_LENGTH; t++) {
      trail.push({ x: probe.initialX, y: probe.initialY, z: probe.initialZ });
    }
    particles.push({
      x: probe.initialX,
      y: probe.initialY,
      z: probe.initialZ,
      vx: 0,
      vy: 0,
      vz: 0,
      trail,
      trailHead: 0,
      isProbe: true,
      probeId: probe.id,
      probeColor: probe.color,
    });
  }

  return particles;
}

export function getVelocityMagnitude(state: ParticleState): number {
  return Math.sqrt(state.vx * state.vx + state.vy * state.vy + state.vz * state.vz);
}
