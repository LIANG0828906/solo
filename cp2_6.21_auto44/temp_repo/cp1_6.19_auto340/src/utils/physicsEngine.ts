export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  trailColor: string;
  trail: { x: number; y: number }[];
  alpha: number;
  life: number;
  maxLife: number;
  clientId: string;
  type: 'circle' | 'spiral';
  spiralAngle?: number;
  spiralRadius?: number;
  spiralCenterX?: number;
  spiralCenterY?: number;
}

export interface FireworkConfig {
  color: string;
  radius: number;
  speed: number;
  type: 'circle' | 'spiral';
}

const GRAVITY = -9.8;
const DRAG = 0.98;
const SPEED_THRESHOLD = 0.5;
const MAX_LIFE = 500;
const TRAIL_LENGTH_MIN = 15;
const TRAIL_LENGTH_MAX = 20;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function desaturateColor(hex: string, amount: number = 0.3): string {
  const { r, g, b } = hexToRgb(hex);
  const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
  return rgbToHex(
    r + (gray - r) * amount,
    g + (gray - g) * amount,
    b + (gray - b) * amount
  );
}

export function createFireworkParticles(
  x: number,
  y: number,
  config: FireworkConfig,
  clientId: string,
  idGenerator: () => string
): Particle[] {
  const particles: Particle[] = [];
  const { color, radius, speed, type } = config;
  const trailColor = desaturateColor(color, 0.3);
  const trailLength =
    TRAIL_LENGTH_MIN + Math.random() * (TRAIL_LENGTH_MAX - TRAIL_LENGTH_MIN);

  let particleCount: number;
  if (type === 'circle') {
    particleCount = 50 + Math.floor(Math.random() * 31);
  } else {
    particleCount = 60 + Math.floor(Math.random() * 41);
  }

  for (let i = 0; i < particleCount; i++) {
    let vx: number, vy: number;
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.1;
    const baseSpeed = (0.5 + Math.random() * 0.5) * speed;

    if (type === 'circle') {
      vx = Math.cos(angle) * baseSpeed * (radius / 60);
      vy = Math.sin(angle) * baseSpeed * (radius / 60);
    } else {
      const spiralRadiusInit = radius * 0.3 + Math.random() * radius * 0.3;
      vx = Math.cos(angle) * baseSpeed * 0.3;
      vy = Math.sin(angle) * baseSpeed * 0.3;
      particles.push({
        id: idGenerator(),
        x,
        y,
        vx,
        vy,
        color,
        trailColor,
        trail: [],
        alpha: 1,
        life: 0,
        maxLife: MAX_LIFE,
        clientId,
        type,
        spiralAngle: angle,
        spiralRadius: spiralRadiusInit,
        spiralCenterX: x,
        spiralCenterY: y
      });
      continue;
    }

    particles.push({
      id: idGenerator(),
      x,
      y,
      vx,
      vy,
      color,
      trailColor,
      trail: [],
      alpha: 1,
      life: 0,
      maxLife: MAX_LIFE,
      clientId,
      type
    });
  }

  return particles;
}

export function updateParticle(particle: Particle, canvasHeight: number): boolean {
  particle.life++;

  particle.trail.unshift({ x: particle.x, y: particle.y });
  if (particle.trail.length > 18) {
    particle.trail.pop();
  }

  if (particle.type === 'spiral' && particle.spiralAngle !== undefined) {
    particle.spiralAngle += 0.08;
    particle.spiralRadius = (particle.spiralRadius || 0) * 1.015;
    const centerX = particle.spiralCenterX || particle.x;
    const centerY = particle.spiralCenterY || particle.y;
    particle.x =
      centerX +
      Math.cos(particle.spiralAngle) * (particle.spiralRadius || 0) +
      particle.vx * 2;
    particle.y =
      centerY +
      Math.sin(particle.spiralAngle) * (particle.spiralRadius || 0) +
      particle.vy * 2;
    particle.vy += GRAVITY * 0.02;
    particle.vx *= DRAG;
    particle.vy *= DRAG;
  } else {
    particle.vy += GRAVITY * 0.05;
    particle.vx *= DRAG;
    particle.vy *= DRAG;
    particle.x += particle.vx;
    particle.y += particle.vy;
  }

  const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
  if (speed < SPEED_THRESHOLD && particle.life > 60) {
    particle.alpha *= 0.95;
  }

  const lifeRatio = particle.life / particle.maxLife;
  particle.alpha = Math.max(0, 1 - lifeRatio);

  if (particle.y > canvasHeight + 50) {
    return false;
  }

  if (particle.alpha <= 0.01) {
    return false;
  }

  if (particle.life >= particle.maxLife) {
    return false;
  }

  return true;
}
