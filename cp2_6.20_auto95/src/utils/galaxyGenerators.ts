import { GalaxyType, ParticlePosition } from '../types';
import { getColorByDistance } from './colorUtils';

const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

const boxMuller = (): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const getParticleSize = (normalizedDistance: number): number => {
  return 3 - normalizedDistance * 2;
};

export const generateSpiralGalaxy = (
  count: number,
  dispersion: number,
  arms: number = 4
): ParticlePosition[] => {
  const particles: ParticlePosition[] = [];
  const maxRadius = 80;
  const dispersionFactor = dispersion / 100;

  for (let i = 0; i < count; i++) {
    const armIndex = i % arms;
    const armAngle = (armIndex / arms) * Math.PI * 2;
    const t = i / count;
    const angle = t * Math.PI * 4 + armAngle;
    const radius = t * maxRadius * (0.8 + Math.random() * 0.4);
    
    const dispersionAmount = radius * dispersionFactor * 0.3;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * dispersionAmount * 2;
    const y = (Math.random() - 0.5) * radius * 0.15;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * dispersionAmount * 2;

    const actualRadius = Math.sqrt(x * x + y * y + z * z);
    const normalizedRadius = Math.min(1, actualRadius / maxRadius);
    const color = getColorByDistance(normalizedRadius);
    const size = getParticleSize(normalizedRadius);

    particles.push({
      x,
      y,
      z,
      originalX: x,
      originalY: y,
      originalZ: z,
      angle,
      radius: actualRadius,
      color,
      size
    });
  }

  return particles;
};

export const generateBarredGalaxy = (
  count: number,
  dispersion: number
): ParticlePosition[] => {
  const particles: ParticlePosition[] = [];
  const maxRadius = 80;
  const barLength = maxRadius * 0.3;
  const dispersionFactor = dispersion / 100;
  const barCount = Math.floor(count * 0.3);
  const armCount = count - barCount;

  for (let i = 0; i < barCount; i++) {
    const t = (i / barCount - 0.5) * 2;
    const x = t * barLength;
    const y = (Math.random() - 0.5) * barLength * 0.15;
    const z = (Math.random() - 0.5) * barLength * 0.15;

    const actualRadius = Math.sqrt(x * x + y * y + z * z);
    const normalizedRadius = Math.min(1, actualRadius / maxRadius);
    const color = getColorByDistance(normalizedRadius);
    const size = getParticleSize(normalizedRadius);

    particles.push({
      x,
      y,
      z,
      originalX: x,
      originalY: y,
      originalZ: z,
      angle: Math.atan2(z, x),
      radius: actualRadius,
      color,
      size
    });
  }

  const arms = 2;
  for (let i = 0; i < armCount; i++) {
    const armIndex = i % arms;
    const armStartAngle = armIndex === 0 ? 0 : Math.PI;
    const t = i / armCount;
    const angle = t * Math.PI * 3 + armStartAngle;
    const radius = barLength + t * (maxRadius - barLength) * (0.8 + Math.random() * 0.4);
    
    const dispersionAmount = radius * dispersionFactor * 0.25;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * dispersionAmount * 2;
    const y = (Math.random() - 0.5) * radius * 0.12;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * dispersionAmount * 2;

    const actualRadius = Math.sqrt(x * x + y * y + z * z);
    const normalizedRadius = Math.min(1, actualRadius / maxRadius);
    const color = getColorByDistance(normalizedRadius);
    const size = getParticleSize(normalizedRadius);

    particles.push({
      x,
      y,
      z,
      originalX: x,
      originalY: y,
      originalZ: z,
      angle,
      radius: actualRadius,
      color,
      size
    });
  }

  return particles.sort(() => Math.random() - 0.5);
};

export const generateEllipticalGalaxy = (
  count: number,
  dispersion: number
): ParticlePosition[] => {
  const particles: ParticlePosition[] = [];
  const maxRadius = 70;
  const dispersionFactor = 0.5 + dispersion / 200;
  const flattening = 0.6;

  for (let i = 0; i < count; i++) {
    const gaussX = boxMuller() * maxRadius * dispersionFactor;
    const gaussY = boxMuller() * maxRadius * dispersionFactor * flattening;
    const gaussZ = boxMuller() * maxRadius * dispersionFactor;

    let x = gaussX;
    let y = gaussY;
    let z = gaussZ;

    const actualRadius = Math.sqrt(x * x + y * y + z * z);
    if (actualRadius > maxRadius) {
      const scale = maxRadius / actualRadius;
      x *= scale;
      y *= scale;
      z *= scale;
    }

    const normalizedRadius = Math.min(1, actualRadius / maxRadius);
    const color = getColorByDistance(normalizedRadius);
    const size = getParticleSize(normalizedRadius);

    particles.push({
      x,
      y,
      z,
      originalX: x,
      originalY: y,
      originalZ: z,
      angle: Math.atan2(z, x),
      radius: actualRadius,
      color,
      size
    });
  }

  return particles;
};

export const generateParticles = (
  type: GalaxyType,
  count: number,
  dispersion: number
): ParticlePosition[] => {
  switch (type) {
    case GalaxyType.SPIRAL:
      return generateSpiralGalaxy(count, dispersion);
    case GalaxyType.BARRED:
      return generateBarredGalaxy(count, dispersion);
    case GalaxyType.ELLIPTICAL:
      return generateEllipticalGalaxy(count, dispersion);
    default:
      return generateSpiralGalaxy(count, dispersion);
  }
};

export const interpolateParticles = (
  startParticles: ParticlePosition[],
  targetParticles: ParticlePosition[],
  progress: number
): ParticlePosition[] => {
  const easedProgress = easeOutCubic(progress);
  const maxLength = Math.max(startParticles.length, targetParticles.length);
  const result: ParticlePosition[] = [];

  for (let i = 0; i < maxLength; i++) {
    const startIdx = i % startParticles.length;
    const targetIdx = i % targetParticles.length;
    const start = startParticles[startIdx];
    const target = targetParticles[targetIdx];

    result.push({
      x: start.x + (target.x - start.x) * easedProgress,
      y: start.y + (target.y - start.y) * easedProgress,
      z: start.z + (target.z - start.z) * easedProgress,
      originalX: target.originalX,
      originalY: target.originalY,
      originalZ: target.originalZ,
      angle: start.angle + (target.angle - start.angle) * easedProgress,
      radius: start.radius + (target.radius - start.radius) * easedProgress,
      color: [
        start.color[0] + (target.color[0] - start.color[0]) * easedProgress,
        start.color[1] + (target.color[1] - start.color[1]) * easedProgress,
        start.color[2] + (target.color[2] - start.color[2]) * easedProgress
      ],
      size: start.size + (target.size - start.size) * easedProgress
    });
  }

  return result;
};

export const updateParticleRotation = (
  particles: ParticlePosition[],
  rotationSpeed: number,
  gravityStrength: number,
  deltaTime: number
): ParticlePosition[] => {
  const speedFactor = rotationSpeed / 100;
  const gravityFactor = gravityStrength / 100;

  return particles.map((p) => {
    const rotationAngle = speedFactor * deltaTime * 0.5;
    const gravityPull = gravityFactor * deltaTime * 0.02;

    const newAngle = p.angle + rotationAngle * (1 / (p.radius * 0.01 + 0.5));

    const pullStrength = gravityPull / (p.radius * 0.01 + 1);
    const pulledRadius = Math.max(5, p.radius * (1 - pullStrength * 0.001));

    const x = Math.cos(newAngle) * pulledRadius;
    const z = Math.sin(newAngle) * pulledRadius;
    const y = p.y;

    return {
      ...p,
      x,
      y,
      z,
      originalX: x,
      originalY: y,
      originalZ: z,
      angle: newAngle,
      radius: pulledRadius
    };
  });
};
