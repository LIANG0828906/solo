export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  baseHue: number;
  hueOffset: number;
  life: number;
  maxLife: number;
  opacity: number;
  band: 'low' | 'mid' | 'high';
}

const BAND_COLORS: Record<string, number> = {
  low: 0,
  mid: 195,
  high: 45,
};

export function createParticle(
  band: 'low' | 'mid' | 'high',
  intensity: number,
  canvasWidth: number,
  canvasHeight: number
): Particle {
  const baseRadius = 2 + intensity * 8;
  const speed = 0.5 + Math.random() * 1.5;
  const angle = Math.random() * Math.PI * 2;
  const life = 180 + Math.random() * 180;

  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: baseRadius,
    baseRadius,
    color: '',
    baseHue: BAND_COLORS[band],
    hueOffset: 0,
    life,
    maxLife: life,
    opacity: 1,
    band,
  };
}

export function updateParticle(
  particle: Particle,
  beatPulse: number,
  canvasWidth: number,
  canvasHeight: number
): Particle {
  particle.life -= 1;
  particle.hueOffset += 0.5;
  particle.x += particle.vx;
  particle.y += particle.vy;

  if (particle.x - particle.radius < 0) {
    particle.x = particle.radius;
    particle.vx = Math.abs(particle.vx);
  } else if (particle.x + particle.radius > canvasWidth) {
    particle.x = canvasWidth - particle.radius;
    particle.vx = -Math.abs(particle.vx);
  }
  if (particle.y - particle.radius < 0) {
    particle.y = particle.radius;
    particle.vy = Math.abs(particle.vy);
  } else if (particle.y + particle.radius > canvasHeight) {
    particle.y = canvasHeight - particle.radius;
    particle.vy = -Math.abs(particle.vy);
  }

  const lifeRatio = particle.life / particle.maxLife;
  particle.opacity = lifeRatio < 0.3 ? lifeRatio / 0.3 : 1;

  const pulseScale = 1 + beatPulse * 0.2;
  particle.radius = particle.baseRadius * pulseScale;

  const hue = (particle.baseHue + particle.hueOffset) % 360;
  const saturation = 80;
  const brightnessBoost = beatPulse * 0.3;
  const lightness = Math.min(80, 55 + brightnessBoost * 25);
  particle.color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${particle.opacity})`;

  return particle;
}

export function manageParticles(
  particles: Particle[],
  freqLow: number,
  freqMid: number,
  freqHigh: number,
  canvasWidth: number,
  canvasHeight: number,
  maxCount: number = 500
): Particle[] {
  particles = particles.filter((p) => p.life > 0);

  const totalCurrent = particles.length;
  const targetLow = Math.floor(freqLow * 180);
  const targetMid = Math.floor(freqMid * 180);
  const targetHigh = Math.floor(freqHigh * 140);

  const currentLow = particles.filter((p) => p.band === 'low').length;
  const currentMid = particles.filter((p) => p.band === 'mid').length;
  const currentHigh = particles.filter((p) => p.band === 'high').length;

  const toSpawn: Particle[] = [];

  if (totalCurrent < maxCount) {
    const deficitLow = Math.max(0, targetLow - currentLow);
    const deficitMid = Math.max(0, targetMid - currentMid);
    const deficitHigh = Math.max(0, targetHigh - currentHigh);

    for (let i = 0; i < Math.min(deficitLow, 5); i++) {
      toSpawn.push(createParticle('low', freqLow, canvasWidth, canvasHeight));
    }
    for (let i = 0; i < Math.min(deficitMid, 5); i++) {
      toSpawn.push(createParticle('mid', freqMid, canvasWidth, canvasHeight));
    }
    for (let i = 0; i < Math.min(deficitHigh, 5); i++) {
      toSpawn.push(createParticle('high', freqHigh, canvasWidth, canvasHeight));
    }
  }

  return [...particles, ...toSpawn];
}
