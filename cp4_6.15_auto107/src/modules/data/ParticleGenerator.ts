import { v4 as uuidv4 } from 'uuid';

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
  trajectory: Array<{ x: number; y: number; z: number }>;
  visible: boolean;
  opacity: number;
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

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function redshiftToColor(redshift: number): { r: number; g: number; b: number } {
  if (redshift >= 0) {
    const t = Math.min(redshift, 1);
    return {
      r: lerp(1.0, 1.0, t),
      g: lerp(0.42, 0.0, t),
      b: lerp(0.21, 0.0, t),
    };
  } else {
    const t = Math.min(Math.abs(redshift), 1);
    return {
      r: lerp(0.3, 0.45, t),
      g: lerp(0.79, 0.04, t),
      b: lerp(0.94, 0.72, t),
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
    
    const redshift = (distance / maxRadius) * 2 - 1 + (Math.random() - 0.5) * 0.2;
    const clampedRedshift = Math.max(-1, Math.min(1, redshift));
    const mass = 0.5 + Math.random() * 1.5;
    const size = mass;
    const velocity = {
      x: finalPosition.x * 0.3,
      y: finalPosition.y * 0.3,
      z: finalPosition.z * 0.3,
    };

    particles.push({
      id: uuidv4(),
      position: { x: 0, y: 0, z: 0 },
      initialPosition: { x: 0, y: 0, z: 0 },
      finalPosition,
      velocity,
      redshift: clampedRedshift,
      mass,
      size,
      color: redshiftToColor(clampedRedshift),
      clusterName: generateClusterName(),
      distance,
      trajectory: [],
      visible: true,
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
  return particles.map((particle) => {
    let newPosition: { x: number; y: number; z: number };
    let newOpacity = particle.opacity;
    const newTrajectory = [...particle.trajectory];

    if (animationPhase === 'explosion' || animationPhase === 'expanding') {
      const explosionProgress = timeProgress * 2;
      
      if (explosionProgress <= 1) {
        const t = easeOutCubic(explosionProgress);
        newPosition = {
          x: lerp(0, particle.finalPosition.x * 0.4, t),
          y: lerp(0, particle.finalPosition.y * 0.4, t),
          z: lerp(0, particle.finalPosition.z * 0.4, t),
        };
      } else {
        const t = easeInOutQuad(Math.min((explosionProgress - 1) * 0.4, 1));
        newPosition = {
          x: lerp(particle.finalPosition.x * 0.4, particle.finalPosition.x, t),
          y: lerp(particle.finalPosition.y * 0.4, particle.finalPosition.y, t),
          z: lerp(particle.finalPosition.z * 0.4, particle.finalPosition.z, t),
        };
      }

      if (newTrajectory.length >= 10) {
        newTrajectory.shift();
      }
      newTrajectory.push({ ...newPosition });
    } else {
      const t = easeInOutQuad(timeProgress);
      newPosition = {
        x: lerp(0, particle.finalPosition.x, t),
        y: lerp(0, particle.finalPosition.y, t),
        z: lerp(0, particle.finalPosition.z, t),
      };
      
      if (newTrajectory.length > 0) {
        const fadeSpeed = deltaTime * 0.5;
        newTrajectory.splice(0, Math.ceil(fadeSpeed * newTrajectory.length));
      }
    }

    const evolvedRedshift = lerp(-0.8, particle.redshift, timeProgress);
    const newColor = redshiftToColor(evolvedRedshift);

    if (!particle.visible && newOpacity > 0) {
      newOpacity = Math.max(0, newOpacity - deltaTime * 2);
    } else if (particle.visible && newOpacity < 1) {
      newOpacity = Math.min(1, newOpacity + deltaTime * 2);
    }

    return {
      ...particle,
      position: newPosition,
      color: newColor,
      trajectory: newTrajectory,
      opacity: newOpacity,
    };
  });
}

export function getParticleById(particles: Particle[], id: string): Particle | undefined {
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
    const matchesRedshift = particle.redshift >= filters.redshiftMin && particle.redshift <= filters.redshiftMax;
    const matchesMass = particle.mass >= filters.massMin && particle.mass <= filters.massMax;
    return {
      ...particle,
      visible: matchesRedshift && matchesMass,
    };
  });
}
