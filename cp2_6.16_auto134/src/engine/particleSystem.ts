import { Particle } from '../types';
import { GAME_CONFIG, COLORS } from '../utils/constants';

export function createExplosionParticles(
  particles: Particle[],
  x: number,
  y: number,
  count: number = 20,
  color: string = COLORS.enemyOrange
): Particle[] {
  const newParticles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    newParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 300,
      maxLife: 300,
      size: 2 + Math.random() * 4,
      color,
      type: 'explosion',
    });
  }
  const result = [...particles, ...newParticles];
  if (result.length > GAME_CONFIG.PARTICLE_LIMIT) {
    return result.slice(result.length - GAME_CONFIG.PARTICLE_LIMIT);
  }
  return result;
}

export function createBossExplosionParticles(
  particles: Particle[],
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): Particle[] {
  const newParticles: Particle[] = [];
  const count = 100;
  const colors = [COLORS.boss, COLORS.enemyOrange, COLORS.enemyRed, '#FFFFFF'];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    const size = 3 + Math.random() * 8;
    newParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 800 + Math.random() * 400,
      maxLife: 1200,
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: 'boss',
    });
  }
  
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * Math.min(canvasWidth, canvasHeight) * 0.4;
    newParticles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 600 + Math.random() * 600,
      maxLife: 1200,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: 'boss',
    });
  }
  
  const result = [...particles, ...newParticles];
  if (result.length > GAME_CONFIG.PARTICLE_LIMIT) {
    return result.slice(result.length - GAME_CONFIG.PARTICLE_LIMIT);
  }
  return result;
}

export function createEngineParticles(
  particles: Particle[],
  x: number,
  y: number,
  engineLevel: number = 1
): Particle[] {
  const count = engineLevel + 1;
  const newParticles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    newParticles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + 5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2 + Math.random() * 2 + engineLevel * 0.5,
      life: 200 + engineLevel * 100,
      maxLife: 200 + engineLevel * 100,
      size: 3 + engineLevel + Math.random() * 2,
      color: `hsl(${30 + Math.random() * 30}, 100%, ${50 + engineLevel * 10}%)`,
      type: 'engine',
    });
  }
  
  const result = [...particles, ...newParticles];
  if (result.length > GAME_CONFIG.PARTICLE_LIMIT) {
    return result.slice(result.length - GAME_CONFIG.PARTICLE_LIMIT);
  }
  return result;
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * (deltaTime / 16.67),
      y: p.y + p.vy * (deltaTime / 16.67),
      life: p.life - deltaTime,
      size: p.type === 'explosion' || p.type === 'boss' 
        ? p.size * 0.98 
        : p.size * 0.99,
    }))
    .filter(p => p.life > 0 && p.size > 0.5);
}

export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    
    if (p.type === 'engine') {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  });
}

export function createStars(width: number, height: number) {
  const stars = [];
  for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.01,
    });
  }
  return stars;
}

export function updateStars(stars: Array<{x: number; y: number; size: number; speed: number; brightness: number; twinkleSpeed: number}>, height: number, deltaTime: number) {
  return stars.map(s => {
    let newY = s.y + s.speed * (deltaTime / 16.67);
    if (newY > height) {
      newY = 0;
    }
    const newBrightness = s.brightness + s.twinkleSpeed * (deltaTime / 16.67);
    return {
      ...s,
      y: newY,
      brightness: (Math.sin(newBrightness) + 1) / 2,
    };
  });
}

export function renderStars(ctx: CanvasRenderingContext2D, stars: Array<{x: number; y: number; size: number; brightness: number}>): void {
  stars.forEach(s => {
    ctx.save();
    ctx.globalAlpha = 0.3 + s.brightness * 0.7;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
