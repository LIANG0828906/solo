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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function cosmologicalExpansion(t: number): number {
  const earlyPhase = 1 - Math.exp(-4 * t);
  const darkEnergyPhase = 0.08 * Math.pow(t, 3);
  return clamp01(earlyPhase + darkEnergyPhase);
}

function redshiftToColor(redshift: number): { r: number; g: number; b: number } {
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

  return particles;
}

export function evolveUniverse(
  particles: Particle[],
  timeProgress: number,
  deltaTime: number,
  animationPhase: 'idle' | 'explosion' | 'expanding' | 'stable'
): Particle[] {
  const t = clamp01(timeProgress);
  const expandFactor = cosmologicalExpansion(t);

  const earlyBlueshiftBias = lerp(-0.5, 0, t);
  const sizeGrowthFactor = lerp(0.7, 1.0, clamp01(t * 1.5));

  return particles.map((particle) => {
    let newPosition: { x: number; y: number; z: number };
    let newOpacity = particle.opacity;
    const newTrajectory: TrajectoryPoint[] = [...particle.trajectory];
    let recordTrajectory = false;

    if (animationPhase === 'explosion' || animationPhase === 'expanding') {
      recordTrajectory = true;
      const animT = t * 1.8;

      if (animT <= 1) {
        const explosionFactor = 1 - Math.exp(-5 * animT);
        newPosition = {
          x: particle.finalPosition.x * 0.35 * explosionFactor,
          y: particle.finalPosition.y * 0.35 * explosionFactor,
          z: particle.finalPosition.z * 0.35 * explosionFactor,
        };
      } else {
        const subT = clamp01((animT - 1) * 0.7);
        const phase2Factor = cosmologicalExpansion(subT);
        newPosition = {
          x: lerp(
            particle.finalPosition.x * 0.35,
            particle.finalPosition.x,
            phase2Factor
          ),
          y: lerp(
            particle.finalPosition.y * 0.35,
            particle.finalPosition.y,
            phase2Factor
          ),
          z: lerp(
            particle.finalPosition.z * 0.35,
            particle.finalPosition.z,
            phase2Factor
          ),
        };
      }

      if (newTrajectory.length >= MAX_TRAJECTORY_LENGTH) {
        newTrajectory.shift();
      }
      for (let i = 0; i < newTrajectory.length; i++) {
        newTrajectory[i].alpha = Math.max(
          0,
          (i + 1) / MAX_TRAJECTORY_LENGTH - 0.1
        );
      }
      newTrajectory.push({
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
        alpha: 1.0,
      });
    } else {
      newPosition = {
        x: particle.finalPosition.x * expandFactor,
        y: particle.finalPosition.y * expandFactor,
        z: particle.finalPosition.z * expandFactor,
      };

      if (recordTrajectory && newTrajectory.length >= MAX_TRAJECTORY_LENGTH) {
        newTrajectory.shift();
      }

      if (newTrajectory.length > 0) {
        const fadeCount = Math.max(1, Math.ceil(deltaTime * 8));
        for (let i = 0; i < fadeCount && newTrajectory.length > 0; i++) {
          newTrajectory.shift();
        }
        for (let i = 0; i < newTrajectory.length; i++) {
          newTrajectory[i].alpha =
            ((i + 1) / newTrajectory.length) * 0.7;
        }
      }
    }

    const redshiftNow =
      particle.redshift * (0.3 + 0.7 * t) + earlyBlueshiftBias * (1 - t);
    const newColor = redshiftToColor(
      Math.max(-1, Math.min(1, redshiftNow))
    );
    const newSize = particle.baseSize * sizeGrowthFactor;

    if (particle.opacity !== particle.targetOpacity) {
      const diff = particle.targetOpacity - particle.opacity;
      const step = DISSOLVE_SPEED * deltaTime;
      if (Math.abs(diff) <= step) {
        newOpacity = particle.targetOpacity;
      } else {
        newOpacity = particle.opacity + Math.sign(diff) * step;
      }
    }

    return {
      ...particle,
      position: newPosition,
      color: newColor,
      size: newSize,
      trajectory: newTrajectory,
      opacity: newOpacity,
    };
  });
}

export function getParticleById(
  particles: Particle[],
  id: string
): Particle | undefined {
  return particles.find((p) => p.id === id);
}

export function filterParticles(
  particles: Particle[],
  filters: {
    redshiftMin: number;
    redshiftMax: number;
    massMin: number;
    massMax: number;
  }
): Particle[] {
  return particles.map((particle) => {
    const matchesRedshift =
      particle.redshift >= filters.redshiftMin &&
      particle.redshift <= filters.redshiftMax;
    const matchesMass =
      particle.mass >= filters.massMin && particle.mass <= filters.massMax;
    const shouldBeVisible = matchesRedshift && matchesMass;
    return {
      ...particle,
      visible: shouldBeVisible,
      targetOpacity: shouldBeVisible ? 1 : 0,
    };
  });
}
