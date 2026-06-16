export interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  spreadSpeed: number;
  velocityX: number;
  velocityY: number;
  isSettled: boolean;
  trail: { x: number; y: number }[];
  settledRadius: number;
}

const MAX_PARTICLES = 300;
const TRAIL_LENGTH = 8;

export function generateParticles(
  startX: number,
  startY: number,
  angle: number,
  speed: number,
  currentParticles: Particle[]
): Particle[] {
  const angleRad = (angle * Math.PI) / 180;
  const particlesPerFrame = Math.max(1, Math.floor(angle / 15));
  const newParticles: Particle[] = [];

  for (let i = 0; i < particlesPerFrame; i++) {
    const radius = 2 + Math.random() * 2;
    const spread = (Math.random() - 0.5) * 0.3;
    const velocityAngle = angleRad + spread;
    const velocityMagnitude = speed * (0.8 + Math.random() * 0.4);

    newParticles.push({
      x: startX + (Math.random() - 0.5) * 4,
      y: startY + (Math.random() - 0.5) * 4,
      radius,
      opacity: 0.7 + Math.random() * 0.2,
      spreadSpeed: 0.05 + Math.random() * 0.05,
      velocityX: Math.cos(velocityAngle) * velocityMagnitude,
      velocityY: Math.sin(velocityAngle) * velocityMagnitude,
      isSettled: false,
      trail: [],
      settledRadius: radius
    });
  }

  const allParticles = [...currentParticles, ...newParticles];
  if (allParticles.length > MAX_PARTICLES) {
    return allParticles.slice(allParticles.length - MAX_PARTICLES);
  }
  return allParticles;
}

export function updateParticles(
  particles: Particle[],
  cupCenter: { x: number; y: number },
  cupRadius: number
): Particle[] {
  return particles.map((p) => {
    if (p.isSettled) {
      if (p.settledRadius < p.radius * 2.5) {
        return {
          ...p,
          settledRadius: p.settledRadius + p.spreadSpeed,
          opacity: Math.max(0.5, p.opacity - 0.002)
        };
      }
      return p;
    }

    const newTrail = [...p.trail, { x: p.x, y: p.y }];
    if (newTrail.length > TRAIL_LENGTH) {
      newTrail.shift();
    }

    const newX = p.x + p.velocityX;
    const newY = p.y + p.velocityY;

    const distToCenter = Math.sqrt(
      Math.pow(newX - cupCenter.x, 2) + Math.pow(newY - cupCenter.y, 2)
    );

    if (distToCenter <= cupRadius - p.radius) {
      const normalizedDist = distToCenter / cupRadius;
      const targetY = cupCenter.y + normalizedDist * cupRadius * 0.3;

      if (newY >= targetY || p.velocityY > -0.5) {
        return {
          ...p,
          x: newX,
          y: newY,
          velocityX: p.velocityX * 0.95,
          velocityY: 0,
          isSettled: true,
          trail: [],
          settledRadius: p.radius
        };
      }
    }

    if (distToCenter > cupRadius + 50) {
      return { ...p, isSettled: true, opacity: 0 };
    }

    return {
      ...p,
      x: newX,
      y: newY,
      velocityY: p.velocityY + 0.15,
      velocityX: p.velocityX * 0.99,
      trail: newTrail
    };
  });
}

export function calculateCoverage(
  particles: Particle[],
  cupCenter: { x: number; y: number },
  cupRadius: number
): number {
  const settledParticles = particles.filter((p) => p.isSettled && p.opacity > 0.1);
  if (settledParticles.length === 0) return 0;

  const cupArea = Math.PI * cupRadius * cupRadius;
  let totalArea = 0;

  settledParticles.forEach((p) => {
    const r = p.settledRadius;
    totalArea += Math.PI * r * r;
  });

  const overlapCorrection = 0.6;
  return Math.min(1, (totalArea * overlapCorrection) / cupArea);
}
