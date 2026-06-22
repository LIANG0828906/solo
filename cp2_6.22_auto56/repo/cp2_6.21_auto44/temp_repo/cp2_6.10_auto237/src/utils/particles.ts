import { ParticleData } from '../types';
import { generateId } from '../data/storyData';

export function createParticles(
  x: number,
  y: number,
  count: number = 50
): ParticleData[] {
  const colors = ['#f5e6b8', '#b87333', '#2a6f97', '#FFD700', '#FFA500', '#FF6B6B'];
  const types: Array<'petal' | 'star'> = ['petal', 'star'];
  const particles: ParticleData[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const distance = 30 + Math.random() * 100;
    
    particles.push({
      id: generateId(),
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: types[Math.floor(Math.random() * types.length)],
      createdAt: Date.now()
    });
  }

  return particles;
}

export function updateParticles(particles: ParticleData[]): ParticleData[] {
  const now = Date.now();
  return particles.filter((p) => now - p.createdAt < 2000);
}

export function getParticleStyle(particle: ParticleData) {
  const age = Date.now() - particle.createdAt;
  const progress = age / 2000;
  const opacity = 1 - progress;
  const scale = 0.5 + progress * 1.5;
  const yOffset = progress * 100;

  return {
    opacity,
    transform: `translate(${particle.x}px, ${particle.y - yOffset}px) scale(${scale}) rotate(${progress * 360}deg)`,
    transition: 'none'
  };
}
