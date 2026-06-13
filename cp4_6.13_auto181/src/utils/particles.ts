export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
  createdAt: number;
}

interface BubbleForParticles {
  x: number;
  y: number;
  color: string;
}

const MAX_PARTICLES = 200;
const PARTICLES_PER_BUBBLE = 8;

let particles: Particle[] = [];
let idCounter = 0;

function generateId(): string {
  return `p_${Date.now()}_${idCounter++}`;
}

export function addParticles(bubbles: BubbleForParticles[]): void {
  const now = performance.now();

  for (const bubble of bubbles) {
    for (let i = 0; i < PARTICLES_PER_BUBBLE; i++) {
      const angle = (i / PARTICLES_PER_BUBBLE) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 80 + Math.random() * 60;

      const particle: Particle = {
        id: generateId(),
        x: bubble.x,
        y: bubble.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: bubble.color,
        radius: 12,
        life: 0.4,
        maxLife: 0.4,
        createdAt: now,
      };

      particles.push(particle);
    }
  }

  if (particles.length > MAX_PARTICLES) {
    const excess = particles.length - MAX_PARTICLES;
    particles = particles.slice(excess);
  }
}

export function updateParticles(deltaTime: number): void {
  const now = performance.now();

  particles = particles.filter(particle => {
    const elapsed = (now - particle.createdAt) / 1000;
    if (elapsed >= particle.maxLife) {
      return false;
    }

    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.vy += 150 * deltaTime;

    const lifeRatio = 1 - elapsed / particle.maxLife;
    particle.radius = 12 * lifeRatio;
    particle.life = particle.maxLife - elapsed;

    return true;
  });
}

export function getParticles(): Particle[] {
  return particles;
}

export function clearParticles(): void {
  particles = [];
}

export function getParticleCount(): number {
  return particles.length;
}
