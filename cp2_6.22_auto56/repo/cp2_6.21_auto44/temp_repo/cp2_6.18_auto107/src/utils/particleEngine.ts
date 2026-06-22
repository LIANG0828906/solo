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
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  centerX: number;
  centerY: number;
  wanderAngle: number;
  wanderRate: number;
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
  const angle = Math.random() * Math.PI * 2;
  const life = 180 + Math.random() * 180;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  let vx = 0, vy = 0, speed = 0;
  let angularSpeed = 0, orbitRadius = 0, wanderAngle = 0, wanderRate = 0;

  if (band === 'low') {
    orbitRadius = 50 + Math.random() * Math.min(canvasWidth, canvasHeight) * 0.35;
    angularSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.005 + Math.random() * 0.01);
    const startAngle = Math.random() * Math.PI * 2;
    vx = Math.cos(startAngle) * orbitRadius;
    vy = Math.sin(startAngle) * orbitRadius;
  } else if (band === 'mid') {
    speed = 0.8 + Math.random() * 1.2;
    const dir = Math.random() * Math.PI * 2;
    vx = Math.cos(dir) * speed;
    vy = Math.sin(dir) * speed;
    wanderAngle = Math.random() * Math.PI * 2;
    wanderRate = 0.1 + Math.random() * 0.2;
  } else {
    speed = 2 + Math.random() * 3;
    const dir = Math.random() * Math.PI * 2;
    vx = Math.cos(dir) * speed;
    vy = Math.sin(dir) * speed;
  }

  let startX = Math.random() * canvasWidth;
  let startY = Math.random() * canvasHeight;

  if (band === 'low') {
    startX = centerX + Math.cos(angle) * orbitRadius;
    startY = centerY + Math.sin(angle) * orbitRadius;
  }

  return {
    x: startX,
    y: startY,
    vx,
    vy,
    radius: baseRadius,
    baseRadius,
    color: '',
    baseHue: BAND_COLORS[band],
    hueOffset: 0,
    life,
    maxLife: life,
    opacity: 1,
    band,
    angle,
    angularSpeed,
    orbitRadius,
    centerX,
    centerY,
    wanderAngle,
    wanderRate,
  };
}

export function updateParticle(
  particle: Particle,
  beatPulse: number,
  freqIntensity: number,
  canvasWidth: number,
  canvasHeight: number
): Particle {
  particle.life -= 1;
  particle.hueOffset = (particle.hueOffset + 0.5) % 360;

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  if (particle.band === 'low') {
    particle.angle += particle.angularSpeed;
    particle.x = centerX + Math.cos(particle.angle) * particle.orbitRadius;
    particle.y = centerY + Math.sin(particle.angle) * particle.orbitRadius;
  } else if (particle.band === 'mid') {
    particle.wanderAngle += (Math.random() - 0.5) * particle.wanderRate * 2;
    const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    const currentDir = Math.atan2(particle.vy, particle.vx);
    const newDir = currentDir + Math.sin(particle.wanderAngle) * particle.wanderRate;
    particle.vx = Math.cos(newDir) * currentSpeed;
    particle.vy = Math.sin(newDir) * currentSpeed;
    particle.x += particle.vx;
    particle.y += particle.vy;
  } else {
    particle.x += particle.vx;
    particle.y += particle.vy;
  }

  if (particle.band !== 'low') {
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
  }

  const dx = particle.x - centerX;
  const dy = particle.y - centerY;
  const distFromCenter = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.min(canvasWidth, canvasHeight) * 0.6;
  const distFactor = Math.max(0.2, 1 - distFromCenter / maxDist);

  const lifeRatio = particle.life / particle.maxLife;
  const lifeOpacity = lifeRatio < 0.3 ? lifeRatio / 0.3 : 1;
  particle.opacity = lifeOpacity * distFactor;

  const pulseScale = 1 + beatPulse * 0.2;
  const freqScale = 0.6 + freqIntensity * 0.8;
  particle.radius = particle.baseRadius * pulseScale * freqScale;

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

  const combinedIntensity = (freqLow + freqMid + freqHigh) / 3;
  const targetTotal = Math.min(maxCount, Math.floor(combinedIntensity * maxCount * 2));

  const currentLow = particles.filter((p) => p.band === 'low').length;
  const currentMid = particles.filter((p) => p.band === 'mid').length;
  const currentHigh = particles.filter((p) => p.band === 'high').length;
  const currentTotal = particles.length;

  const bandWeightLow = freqLow + 0.01;
  const bandWeightMid = freqMid + 0.01;
  const bandWeightHigh = freqHigh + 0.01;
  const totalWeight = bandWeightLow + bandWeightMid + bandWeightHigh;

  const targetLow = Math.floor(targetTotal * (bandWeightLow / totalWeight));
  const targetMid = Math.floor(targetTotal * (bandWeightMid / totalWeight));
  const targetHigh = Math.floor(targetTotal * (bandWeightHigh / totalWeight));

  const toSpawn: Particle[] = [];

  if (currentTotal < maxCount) {
    const deficitLow = Math.max(0, targetLow - currentLow);
    const deficitMid = Math.max(0, targetMid - currentMid);
    const deficitHigh = Math.max(0, targetHigh - currentHigh);

    const spawnLow = Math.min(deficitLow, 5, maxCount - currentTotal);
    const spawnMid = Math.min(deficitMid, 5, maxCount - currentTotal - spawnLow);
    const spawnHigh = Math.min(deficitHigh, 5, maxCount - currentTotal - spawnLow - spawnMid);

    for (let i = 0; i < spawnLow; i++) {
      toSpawn.push(createParticle('low', freqLow, canvasWidth, canvasHeight));
    }
    for (let i = 0; i < spawnMid; i++) {
      toSpawn.push(createParticle('mid', freqMid, canvasWidth, canvasHeight));
    }
    for (let i = 0; i < spawnHigh; i++) {
      toSpawn.push(createParticle('high', freqHigh, canvasWidth, canvasHeight));
    }
  }

  const result = [...particles, ...toSpawn];
  if (result.length > maxCount) {
    return result.slice(0, maxCount);
  }
  return result;
}
