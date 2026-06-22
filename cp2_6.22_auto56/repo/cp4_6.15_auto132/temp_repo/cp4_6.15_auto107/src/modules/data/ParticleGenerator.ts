import { v4 as uuidv4 } from 'uuid';

export const MAX_TRAJECTORY_LENGTH = 10;
export const DISSOLVE_SPEED = 2.5;

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  alpha: number;
}

export interface Particle {
  id: string;
  position: { x: number; y: number; z: number };
  initialPosition: { x: number; y: number; z: number };
  finalPosition: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  redshift: number;
  mass: number;
  size: number;
  color: { r: number; g: number; b: number };
  clusterName: string;
  distance: number;
  trajectory: TrajectoryPoint[];
  visible: boolean;
  targetOpacity: number;
  opacity: number;
  baseSize: number;
}

const CLUSTER_NAMES = [
  'Virgo Cluster',
  'Coma Cluster',
  'Local Group',
  'Hydra Cluster',
  'Centaurus Cluster',
  'Perseus Cluster',
  'Ophiuchus Cluster',
  'Norma Cluster',
  'Shapley Supercluster',
  'Hercules Supercluster',
  'Leo Cluster',
  'Cancer Cluster',
  'Pisces-Cetus Supercluster',
  'Horologium Supercluster',
  'Corona Borealis Supercluster',
];

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export function cosmologicalExpansion(t: number): number {
  const earlyPhase = 1 - Math.exp(-4 * t);
  const darkEnergyPhase = 0.08 * Math.pow(t, 3);
  return clamp01(earlyPhase + darkEnergyPhase);
}

export function redshiftToColor(redshift: number): { r: number; g: number; b: number } {
  if (redshift >= 0) {
    const t = Math.min(redshift, 1);
    return {
      r: lerp(1.0, 1.0, t),
      g: lerp(0.55, 0.1, t),
      b: lerp(0.3, 0.0, t),
    };
  } else {
    const t = Math.min(Math.abs(redshift), 1);
    return {
      r: lerp(0.35, 0.5, t),
      g: lerp(0.85, 0.08, t),
      b: lerp(1.0, 0.85, t),
    };
  }
}

export function redshiftToColorRef(
  redshift: number,
  out: { r: number; g: number; b: number }
): void {
  if (redshift >= 0) {
    const t = Math.min(redshift, 1);
    out.r = lerp(1.0, 1.0, t);
    out.g = lerp(0.55, 0.1, t);
    out.b = lerp(0.3, 0.0, t);
  } else {
    const t = Math.min(Math.abs(redshift), 1);
    out.r = lerp(0.35, 0.5, t);
    out.g = lerp(0.85, 0.08, t);
    out.b = lerp(1.0, 0.85, t);
  }
}

function generateRandomPosition(radius: number): { x: number; y: number; z: number } {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.pow(Math.random(), 1 / 3) * radius;

  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  };
}

function generateClusterName(): string {
  return CLUSTER_NAMES[Math.floor(Math.random() * CLUSTER_NAMES.length)];
}

export function createUniverse(count: number): Particle[] {
  const particles: Particle[] = [];
  const maxRadius = 100;

  for (let i = 0; i < count; i++) {
    const finalPosition = generateRandomPosition(maxRadius);
    const distance = Math.sqrt(
      finalPosition.x ** 2 + finalPosition.y ** 2 + finalPosition.z ** 2
    );

    const redshift =
      (distance / maxRadius) * 1.8 - 0.9 + (Math.random() - 0.5) * 0.15;
    const clampedRedshift = Math.max(-1, Math.min(1, redshift));
    const mass = 0.5 + Math.random() * 1.5;
    const baseSize = mass;
    const velocity = {
      x: finalPosition.x * 0.3,
      y: finalPosition.y * 0.3,
      z: finalPosition.z * 0.3,
    };

    const trajectory: TrajectoryPoint[] = [];

    particles.push({
      id: uuidv4(),
      position: { x: 0, y: 0, z: 0 },
      initialPosition: { x: 0, y: 0, z: 0 },
      finalPosition,
      velocity,
      redshift: clampedRedshift,
      mass,
      size: baseSize,
      baseSize,
      color: redshiftToColor(clampedRedshift),
      clusterName: generateClusterName(),
      distance,
      trajectory,
      visible: true,
      targetOpacity: 1,
      opacity: 1,
    });
  }

  console.log(`[Cosmos] Initial particles created: ${particles.length}`);
  return particles;
}

const _tmpColor = { r: 0, g: 0, b: 0 };

export function evolveParticleWriteBuffers(
  particleIndex: number,
  p: Particle,
  timeProgress: number,
  deltaTime: number,
  animationPhase: 'idle' | 'explosion' | 'expanding' | 'stable',
  matchesFilter: boolean,
  posBuffer: Float32Array,
  colorBuffer: Float32Array,
  sizeBuffer: Float32Array,
  opacityBuffer: Float32Array,
  linePosBuffer: Float32Array,
  lineColorBuffer: Float32Array
): void {
  const t = clamp01(timeProgress);
  const expandFactor = cosmologicalExpansion(t);
  const earlyBlueshiftBias = lerp(-0.5, 0, t);
  const sizeGrowthFactor = lerp(0.7, 1.0, clamp01(t * 1.5));

  let px: number, py: number, pz: number;
  let recordTrajectory = false;

  if (animationPhase === 'explosion' || animationPhase === 'expanding') {
    recordTrajectory = true;
    const animT = t * 1.8;

    if (animT <= 1) {
      const explosionFactor = 1 - Math.exp(-5 * animT);
      const f = 0.35 * explosionFactor;
      px = p.finalPosition.x * f;
      py = p.finalPosition.y * f;
      pz = p.finalPosition.z * f;
    } else {
      const subT = clamp01((animT - 1) * 0.7);
      const phase2Factor = cosmologicalExpansion(subT);
      px = lerp(p.finalPosition.x * 0.35, p.finalPosition.x, phase2Factor);
      py = lerp(p.finalPosition.y * 0.35, p.finalPosition.y, phase2Factor);
      pz = lerp(p.finalPosition.z * 0.35, p.finalPosition.z, phase2Factor);
    }
  } else {
    px = p.finalPosition.x * expandFactor;
    py = p.finalPosition.y * expandFactor;
    pz = p.finalPosition.z * expandFactor;
  }

  if (recordTrajectory) {
    if (p.trajectory.length >= MAX_TRAJECTORY_LENGTH) {
      p.trajectory.shift();
    }
    const len = p.trajectory.length;
    for (let i = 0; i < len; i++) {
      p.trajectory[i].alpha = Math.max(0, (i + 1) / MAX_TRAJECTORY_LENGTH - 0.1);
    }
    p.trajectory.push({ x: px, y: py, z: pz, alpha: 1 });
  } else if (p.trajectory.length > 0) {
    const fadeCount = Math.max(1, Math.ceil(deltaTime * 8));
    for (let i = 0; i < fadeCount && p.trajectory.length > 0; i++) {
      p.trajectory.shift();
    }
    const len = p.trajectory.length;
    for (let i = 0; i < len; i++) {
      p.trajectory[i].alpha = ((i + 1) / len) * 0.7;
    }
  }

  const redshiftNow =
    p.redshift * (0.3 + 0.7 * t) + earlyBlueshiftBias * (1 - t);
  redshiftToColorRef(Math.max(-1, Math.min(1, redshiftNow)), _tmpColor);

  const targetOpacity = matchesFilter ? 1 : 0;
  let curOpacity = p.opacity;
  if (curOpacity !== targetOpacity) {
    const diff = targetOpacity - curOpacity;
    const step = DISSOLVE_SPEED * deltaTime;
    curOpacity = Math.abs(diff) <= step ? targetOpacity : curOpacity + Math.sign(diff) * step;
    p.opacity = curOpacity;
  }

  const finalSize = p.baseSize * sizeGrowthFactor;

  const pIdx3 = particleIndex * 3;
  posBuffer[pIdx3] = px;
  posBuffer[pIdx3 + 1] = py;
  posBuffer[pIdx3 + 2] = pz;

  colorBuffer[pIdx3] = _tmpColor.r;
  colorBuffer[pIdx3 + 1] = _tmpColor.g;
  colorBuffer[pIdx3 + 2] = _tmpColor.b;

  sizeBuffer[particleIndex] = finalSize;
  opacityBuffer[particleIndex] = curOpacity;

  const traj = p.trajectory;
  const tlen = traj.length;
  const lineSegsPerParticle = MAX_TRAJECTORY_LENGTH - 1;
  const baseLineIdx = particleIndex * lineSegsPerParticle * 6;
  const baseLineColorIdx = particleIndex * lineSegsPerParticle * 6;

  for (let s = 0; s < lineSegsPerParticle; s++) {
    const ia = s;
    const ib = s + 1;
    const segHasBoth = ia < tlen && ib < tlen;
    const posAS = baseLineIdx + s * 6;
    const colAS = baseLineColorIdx + s * 6;

    if (segHasBoth) {
      const a = traj[ia];
      const b = traj[ib];
      linePosBuffer[posAS] = a.x;
      linePosBuffer[posAS + 1] = a.y;
      linePosBuffer[posAS + 2] = a.z;
      linePosBuffer[posAS + 3] = b.x;
      linePosBuffer[posAS + 4] = b.y;
      linePosBuffer[posAS + 5] = b.z;

      const aAlpha = a.alpha * curOpacity;
      const bAlpha = b.alpha * curOpacity;

      lineColorBuffer[colAS] = _tmpColor.r;
      lineColorBuffer[colAS + 1] = _tmpColor.g;
      lineColorBuffer[colAS + 2] = _tmpColor.b;
      lineColorBuffer[colAS + 3] = aAlpha;
      lineColorBuffer[colAS + 4] = _tmpColor.r;
      lineColorBuffer[colAS + 5] = _tmpColor.g;
      lineColorBuffer[colAS + 6] = _tmpColor.b;
      lineColorBuffer[colAS + 7] = bAlpha;
    } else {
      linePosBuffer[posAS] = 0;
      linePosBuffer[posAS + 1] = 0;
      linePosBuffer[posAS + 2] = 0;
      linePosBuffer[posAS + 3] = 0;
      linePosBuffer[posAS + 4] = 0;
      linePosBuffer[posAS + 5] = 0;
      lineColorBuffer[colAS + 3] = 0;
      lineColorBuffer[colAS + 7] = 0;
    }
  }
}

export function getParticleById(
  particles: Particle[],
  id: string
): Particle | undefined {
  return particles.find((p) => p.id === id);
}

export function particleMatchesFilter(
  particle: Particle,
  filters: {
    redshiftMin: number;
    redshiftMax: number;
    massMin: number;
    massMax: number;
  }
): boolean {
  return (
    particle.redshift >= filters.redshiftMin &&
    particle.redshift <= filters.redshiftMax &&
    particle.mass >= filters.massMin &&
    particle.mass <= filters.massMax
  );
}
